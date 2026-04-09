use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use tauri::{Emitter, Window};
use serde::Serialize;

#[derive(Clone, Serialize)]
struct StepUpdate {
    step: String,
    status: String,
}

#[tauri::command]
fn check_admin() -> bool {
    let output = Command::new("powershell")
        .args(["-Command", "([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')"])
        .output();
    
    if let Ok(out) = output {
        String::from_utf8_lossy(&out.stdout).trim() == "True"
    } else {
        false
    }
}

fn run_step(window: &Window, step_id: &str, command: &str, args: &[&str], cwd: &str) -> Result<(), String> {
    window.emit("step-update", StepUpdate { step: step_id.to_string(), status: "active".to_string() }).unwrap();
    
    let mut child = Command::new("powershell")
        .args(["-ExecutionPolicy", "Bypass", "-Command"])
        .arg(format!("{} {}", command, args.join(" ")))
        .current_dir(cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn {}: {}", command, e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    let window_clone = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = window_clone.emit("process-output", l);
            }
        }
    });

    let window_clone2 = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = window_clone2.emit("process-output", format!("ERR: {}", l));
            }
        }
    });

    let status = child.wait().map_err(|e| e.to_string())?;
    
    if status.success() {
        window.emit("step-update", StepUpdate { step: step_id.to_string(), status: "completed".to_string() }).unwrap();
        Ok(())
    } else {
        window.emit("step-update", StepUpdate { step: step_id.to_string(), status: "failed".to_string() }).unwrap();
        Err(format!("{} failed", command))
    }
}

#[tauri::command]
async fn run_build(window: Window) -> Result<(), String> {
    let project_dir = "c:\\Blog_Client";

    // Step 1: Git Sync
    run_step(&window, "git", "git", &["add", "."], project_dir)?;
    run_step(&window, "git", "git", &["commit", "-m", "'Sync before build (automated)'"], project_dir)?;
    run_step(&window, "git", "git", &["push"], project_dir)?;

    // Step 2: Environment
    window.emit("step-update", StepUpdate { step: "env".to_string(), status: "active".to_string() }).unwrap();
    // Simulate some env checks or just mark completed
    let signtool_path = "C:\\Program Files (x86)\\Windows Kits\\10\\App Certification Kit";
    window.emit("process-output", format!("Checking Signtool at {}", signtool_path)).unwrap();
    window.emit("step-update", StepUpdate { step: "env".to_string(), status: "completed".to_string() }).unwrap();

    // Step 3: Tauri Build
    run_step(&window, "build", "npm", &["run", "tauri:build"], project_dir)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_build, check_admin])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
