use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use tauri::{Emitter, Window};
use serde::Serialize;
use std::path::Path;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Clone, Serialize)]
struct StepUpdate {
    step: String,
    status: String,
}

#[derive(Clone, Serialize)]
struct ProcessOutput {
    content: String,
    is_error: bool,
}

#[tauri::command]
fn check_admin() -> bool {
    let mut cmd = Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.args(["-Command", "([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')"])
        .output();
    
    if let Ok(out) = output {
        String::from_utf8_lossy(&out.stdout).trim() == "True"
    } else {
        false
    }
}

#[tauri::command]
fn reveal_in_explorer(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn run_step(window: &Window, step_id: &str, command: &str, args: Vec<&str>, cwd: &str) -> Result<(), String> {
    window.emit("step-update", StepUpdate { step: step_id.to_string(), status: "active".to_string() }).unwrap();
    
    let mut cmd = Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd.args(["-ExecutionPolicy", "Bypass", "-Command"])
        .arg(format!("{} {}", command, args.join(" "))) // PowerShell still likes the command string sometimes
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
                let _ = window_clone.emit("process-output", ProcessOutput { content: l, is_error: false });
            }
        }
    });

    let window_clone2 = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = window_clone2.emit("process-output", ProcessOutput { content: l, is_error: true });
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
async fn run_build(window: Window, target: String) -> Result<(), String> {
    let project_dir = "c:\\Blog_Client";

    // Step 1: Git Sync
    window.emit("step-update", StepUpdate { step: "git".to_string(), status: "active".to_string() }).unwrap();
    
    let mut cmd = Command::new("git");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    // Check if there are changes to commit
    let status_output = cmd.args(["status", "--porcelain"])
        .current_dir(project_dir)
        .output()
        .map_err(|e| format!("Failed to check git status: {}", e))?;
    
    if !status_output.stdout.is_empty() {
        run_step(&window, "git", "git", vec!["add", "."], project_dir)?;
        run_step(&window, "git", "git", vec!["commit", "-m", "'Sync before build (automated)'"], project_dir)?;
        // We push if we committed
        let _ = run_step(&window, "git", "git", vec!["push"], project_dir);
    } else {
        window.emit("process-output", ProcessOutput { content: "Working tree clean, skipping commit.".to_string(), is_error: false }).unwrap();
        // Still try to push in case of unpushed commits
        let _ = run_step(&window, "git", "git", vec!["push"], project_dir);
    }

    // Step 2: Environment
    window.emit("step-update", StepUpdate { step: "env".to_string(), status: "active".to_string() }).unwrap();
    
    if target == "windows" {
        let signtool_path = "C:\\Program Files (x86)\\Windows Kits\\10\\App Certification Kit\\signtool.exe";
        let exists = Path::new(signtool_path).exists();
        
        window.emit("process-output", ProcessOutput { 
            content: format!("Checking Signtool existence: {}", if exists { "FOUND" } else { "MISSING" }), 
            is_error: !exists 
        }).unwrap();

        if !exists {
            window.emit("step-update", StepUpdate { step: "env".to_string(), status: "failed".to_string() }).unwrap();
            return Err("Signtool not found. Please install Windows SDK.".to_string());
        }
    } else if target == "android" {
        window.emit("process-output", ProcessOutput { content: "Skipping Windows Signtool check for Android build.".to_string(), is_error: false }).unwrap();
        // You could add Android SDK/NDK checks here if desired
    }

    window.emit("step-update", StepUpdate { step: "env".to_string(), status: "completed".to_string() }).unwrap();

    // Step 3: Build
    if target == "android" {
        run_step(&window, "build", "npx", vec!["tauri", "android", "build"], project_dir)?;
    } else if target == "windows-x86" {
        run_step(&window, "build", "npm", vec!["run", "tauri:build:x86"], project_dir)?;
    } else if target == "windows-x64" {
        run_step(&window, "build", "npm", vec!["run", "tauri:build"], project_dir)?;
    } else {
        return Err(format!("Unknown target: {}", target));
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_build, check_admin, reveal_in_explorer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

