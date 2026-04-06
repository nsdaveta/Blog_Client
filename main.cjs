const { app, BrowserWindow, protocol, shell, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// GLOBAL SECURITY HUB (Enables Native APIs like Share)
app.commandLine.appendSwitch('enable-features', 'WebShare');
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
  // SMART LOADING: Check for dist first (vite), then dist-temp (electron-builder)
  const fs = require('fs');
  const distPath = path.join(__dirname, 'dist', 'index.html');
  const distTempPath = path.join(__dirname, 'dist-temp', 'index.html');
  const targetPath = fs.existsSync(distPath) ? distPath : distTempPath;

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
    const { exec } = require('child_process');
    // Using -Sta mode to ensure compatibility with Windows 11 Shell
    const command = `powershell -Sta -Command "Add-Type -AssemblyName System.Runtime.WindowsRuntime; [Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel.DataTransfer, ContentType = WindowsRuntime] | Out-Null; [Windows.ApplicationModel.DataTransfer.DataTransferManager]::ShowShareUI()"`;
    exec(command);
  } catch (err) {
    log.error('Native Bridge Selection Exception:', err);
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});