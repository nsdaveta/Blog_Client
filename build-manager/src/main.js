const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

let buildBtn = document.querySelector("#build-trigger");
let terminal = document.querySelector("#terminal");
let statusText = document.querySelector("#status-text");
let timerDisplay = document.querySelector("#build-timer");

let steps = {
  git: document.querySelector("#step-git"),
  env: document.querySelector("#step-env"),
  build: document.querySelector("#step-build")
};

let progressBars = {
  git: document.querySelector("#progress-git"),
  env: document.querySelector("#progress-env"),
  build: document.querySelector("#progress-build")
};

let startTime = 0;
let timerInterval = null;

function appendLog(text, type = "info") {
  const line = document.createElement("div");
  line.className = "terminal-line";
  
  if (type === "error") line.style.color = "#f87171";
  if (type === "success") line.style.color = "#34d399";
  if (type === "command") line.style.color = "#60a5fa";
  if (type === "warning") line.style.color = "#fbbf24";
  
  line.textContent = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function updateStep(stepName, state) {
  const step = steps[stepName];
  if (!step) return;
  step.classList.remove("active", "completed", "failed");
  if (state) step.classList.add(state);

  if (state === "active") {
    progressBars[stepName].style.width = "40%";
    progressBars[stepName].style.background = "#60a5fa";
  } else if (state === "completed") {
    progressBars[stepName].style.width = "100%";
    progressBars[stepName].style.background = "#34d399";
  } else if (state === "failed") {
    progressBars[stepName].style.width = "100%";
    progressBars[stepName].style.background = "#f87171";
  }
}

async function checkAdmin() {
  try {
    const isAdmin = await invoke("check_admin");
    if (!isAdmin) {
      document.querySelector("#admin-banner").style.display = "flex";
    }
  } catch (e) {
    console.error(e);
  }
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// Listen for backend events
listen('process-output', (event) => {
  const { content, is_error } = event.payload;
  // Some logs are standard progress but go to stderr, we filter those
  let type = is_error ? "error" : "info";
  if (content.toLowerCase().includes("warning")) type = "warning";
  if (content.startsWith(">")) type = "command";
  
  appendLog(content, type);
});

listen('step-update', (event) => {
  const { step, status } = event.payload;
  updateStep(step, status);
  statusText.textContent = `Processing ${step}...`;
});

let buildBtnX64 = document.querySelector("#build-x64");
let buildBtnX86 = document.querySelector("#build-x86");
let androidBtn = document.querySelector("#android-trigger");

function showSuccessUI(target) {
  const container = document.querySelector(".terminal-container");
  const actionArea = document.createElement("div");
  actionArea.style.display = "flex";
  actionArea.style.gap = "1rem";
  actionArea.style.marginTop = "1rem";
  actionArea.id = "post-build-actions";

  const openBtn = document.createElement("button");
  openBtn.className = "build-btn";
  openBtn.style.background = "linear-gradient(135deg, #34d399 0%, #10b981 100%)";
  
  if (target === "android") {
    openBtn.textContent = "Open APK Folder";
    openBtn.onclick = () => {
      invoke("reveal_in_explorer", "C:\\Blog_Client\\src-tauri\\gen\\android\\app\\build\\outputs\\apk\\release");
    };
  } else if (target === "windows-x86") {
    openBtn.textContent = "Open x86 MSI Folder";
    openBtn.onclick = () => {
      invoke("reveal_in_explorer", "C:\\Blog_Client\\src-tauri\\target\\i686-pc-windows-msvc\\release\\bundle\\msi");
    };
  } else {
    openBtn.textContent = "Open x64 MSI Folder";
    openBtn.onclick = () => {
      invoke("reveal_in_explorer", "C:\\Blog_Client\\src-tauri\\target\\release\\bundle\\msi");
    };
  }

  actionArea.appendChild(openBtn);
  container.parentNode.insertBefore(actionArea, container.nextSibling);
}

async function startBuild(target) {
  const existingActions = document.querySelector("#post-build-actions");
  if (existingActions) existingActions.remove();

  // Disable all buttons
  buildBtnX64.disabled = true;
  buildBtnX86.disabled = true;
  androidBtn.disabled = true;
  
  let activeBtn;
  let originalText;

  if (target === "windows-x64") {
    activeBtn = buildBtnX64;
    originalText = "Windows x64";
  } else if (target === "windows-x86") {
    activeBtn = buildBtnX86;
    originalText = "Windows x86";
  } else {
    activeBtn = androidBtn;
    originalText = "Build Android";
  }
  
  activeBtn.textContent = "Building...";
  terminal.innerHTML = "";
  appendLog(`> Initializing ${target.toUpperCase()} build sequence...`, "command");
  
  // Reset UI
  Object.keys(steps).forEach(s => updateStep(s, null));
  progressBars.git.style.width = "0%";
  progressBars.env.style.width = "0%";
  progressBars.build.style.width = "0%";
  timerDisplay.textContent = "00:00";

  startTimer();

  try {
    await invoke("run_build", { target });
    statusText.textContent = `${target.toUpperCase()} Build Success`;
    appendLog(`>>> ${target.toUpperCase()} PIPELINE COMPLETED SUCCESSFULLY <<<`, "success");
    activeBtn.textContent = originalText;
    showSuccessUI(target);
  } catch (err) {
    statusText.textContent = "Build Failed";
    appendLog(`FATAL ERROR: ${err}`, "error");
    activeBtn.textContent = "Retry Build";
  } finally {
    buildBtnX64.disabled = false;
    buildBtnX86.disabled = false;
    androidBtn.disabled = false;
    stopTimer();
  }
}

buildBtnX64.addEventListener("click", () => startBuild("windows-x64"));
buildBtnX86.addEventListener("click", () => startBuild("windows-x86"));
androidBtn.addEventListener("click", () => startBuild("android"));

// Initialization
checkAdmin();
appendLog("System ready. Project path: c:\\Blog_Client");

