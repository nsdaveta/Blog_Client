const { app, BrowserWindow, protocol, shell, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// GLOBAL SECURITY HUB (Enables Native APIs via Bridge)
app.enableSandbox(); 
app.disableHardwareAcceleration();

// Setup logging
log.transports.file.level = 'info';
log.info('Blog App Initializing in Production Mode...');

// SYSTEM-LEVEL SWITCHES
if (process.platform === 'win32') {
  app.setAppUserModelId('com.blog.app');
}

// REGISTER PROTOCOLS BEFORE READY
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'file',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
      bypassCSP: true
    }
  }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, 'dist-temp', 'favicon.png'),
    backgroundColor: '#0d0f14',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
      webSecurity: true,
      devTools: true
    }
  });

  // NAVIGATION HANDLER - RELAXED FOR NATIVE APIS
  win.webContents.on('will-navigate', (event, url) => {
    // ONLY block and externalize actual web domains
    if (url.startsWith('http') && !url.includes('localhost')) {
      event.preventDefault();
      shell.openExternal(url);
    }
    // Allow ALL file:// navigations (internal routing + share hooks)
  });

  win.setMenu(null);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Use a relative load path which is safer in production
  // SMART LOADING: Check for dist-temp first (electron-builder), then dist (vite)
  const fs = require('fs');
  const distTempPath = path.join(__dirname, 'dist-temp', 'index.html');
  const distPath = path.join(__dirname, 'dist', 'index.html');
  const targetPath = fs.existsSync(distTempPath) ? distTempPath : distPath;

  win.loadFile(targetPath)
    .catch(err => {
       log.error('Navigation Failure:', err);
       // Last resort: Development Fallback
       win.loadURL('http://localhost:5173');
    });

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Handle renderer crashes without a restart loop
  win.webContents.on('render-process-gone', (event, details) => {
    log.error('Renderer process crash detected:', details);
  });
}

// ── NATIVE SHARE BRIDGE (PowerShell Native Pane Trigger) ──────────────
ipcMain.on('native-share', async (event, data) => {
  const { title, url } = data;
  try {
    // 1. Primary: Try the WinRT Shell Trigger
    const { exec } = require('child_process');
    const psCommand = `powershell -Command "Add-Type -AssemblyName System.Runtime.WindowsRuntime; [Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel.DataTransfer, ContentType = WindowsRuntime] | Out-Null; [Windows.ApplicationModel.DataTransfer.DataTransferManager]::ShowShareUI()"`;
    exec(psCommand);

    // 2. Secondary: If the Pane is blocked, we trigger the "Native Social Hub" 
    // This is a robust way to give the user a native sharing experience.
    const socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    // We'll open this if the Pane doesn't appear (Wait 500ms)
    setTimeout(() => {
       // Only open this if we don't have confirmation of the pane (simplified for now)
       // shell.openExternal(socialUrl); // Disabled until we verify the pane
    }, 500);
  } catch (err) {
    log.error('Native Bridge Exception:', err);
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});