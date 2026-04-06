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
  win.loadFile(path.join(__dirname, 'dist-temp', 'index.html'))
    .catch(err => log.error('Load failure:', err));

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
    // We use a PowerShell snippet to safely trigger the Windows 11 Share UI
    // without using the unstable Chromium WebShare implementation.
    // Advanced PowerShell bridge for Windows 11 Share Pane
    const { execPath } = require('process');
    const { exec } = require('child_process');
    
    // This command uses the Windows Runtime (WinRT) assembly to trigger the Share UI 
    // for the currently active window identifed by the Shell.
    const psScript = `
      $url = '${url}'
      $title = '${title}'
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      [Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel.DataTransfer, ContentType = WindowsRuntime] | Out-Null
      try {
        [Windows.ApplicationModel.DataTransfer.DataTransferManager]::ShowShareUI()
      } catch {
        # Fallback to social URI if ShowShareUI is blocked by policy
        Start-Process "https://www.facebook.com/sharer/sharer.php?u=$url"
      }
    `;
    
    const command = `powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`;
    
    exec(command, (err) => {
       if(err) log.error('Native Share Bridge Execution Error:', err);
    });
  } catch (err) {
    log.error('Native Share Bridge Error:', err);
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});