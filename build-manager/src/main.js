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

function showSuccessUI() {
  const container = document.querySelector(".terminal-container");
  const actionArea = document.createElement("div");
  actionArea.style.display = "flex";
  actionArea.style.gap = "1rem";
  actionArea.style.marginTop = "1rem";
  actionArea.id = "post-build-actions";

  const openBtn = document.createElement("button");
  openBtn.className = "build-btn";
  openBtn.style.background = "linear-gradient(135deg, #34d399 0%, #10b981 100%)";
  openBtn.textContent = "Open MSI Folder";
  openBtn.onclick = () => {
    // Reveal the generated installer
    invoke("reveal_in_explorer", "C:\\Blog_Client\\src-tauri\\target\\release\\bundle\\msi");
  };

  actionArea.appendChild(openBtn);
  container.parentNode.insertBefore(actionArea, container.nextSibling);
}

buildBtn.addEventListener("click", async () => {
  const existingActions = document.querySelector("#post-build-actions");
  if (existingActions) existingActions.remove();

  buildBtn.disabled = true;
  buildBtn.textContent = "Build in Progress...";
  terminal.innerHTML = "";
  appendLog("> Initializing build sequence...", "command");
  
  // Reset UI
  Object.keys(steps).forEach(s => updateStep(s, null));
  progressBars.git.style.width = "0%";
  progressBars.env.style.width = "0%";
  progressBars.build.style.width = "0%";
  timerDisplay.textContent = "00:00";

  startTimer();

  try {
    await invoke("run_build");
    statusText.textContent = "Build Success";
    appendLog(">>> BUILD PIPELINE COMPLETED SUCCESSFULLY <<<", "success");
    buildBtn.textContent = "Restart Build";
    showSuccessUI();
  } catch (err) {
    statusText.textContent = "Build Failed";
    appendLog(`FATAL ERROR: ${err}`, "error");
    buildBtn.textContent = "Retry Build";
  } finally {
    buildBtn.disabled = false;
    stopTimer();
  }
});

// Initialization
checkAdmin();
appendLog("System ready. Project path: c:\\Blog_Client");

