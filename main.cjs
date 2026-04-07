const { app, BrowserWindow, protocol, shell, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// GLOBAL SYSTEM HUB (Enables Native Windows 11 APIs)
app.commandLine.appendSwitch('enable-features', 'WebShare');
// Disable all sandbox features that interfere with native shell APIs
app.commandLine.appendSwitch('no-sandbox'); 
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');
app.commandLine.appendSwitch('log-level', '3'); 

// Setup logging
log.transports.file.level = 'info';
log.info('Blog App Initializing in Native Share Mode...');

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
    title: 'Blogify', // Explicit title required for some native Win11 APIs
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

// ── NATIVE SHARE HUB (Strict Windows 11 Integration) ──
ipcMain.on('native-share', async (event, data) => {
  const { title, url } = data;
  const log = require('electron-log');
  log.info(`Broadcasting Strict Native Share: ${title}`);
  
  try {
    const { shell } = require('electron');
    const encodedTitle = encodeURIComponent(title);
    const encodedUri = encodeURIComponent(url);
    
    // Using the official Windows Store Share protocol to trigger the OS flyout.
    // This is the most stable method for un-packaged apps to get the real Win11 Share Pane.
    const shareUrl = `ms-windows-store://share/?title=${encodedTitle}&uri=${encodedUri}`;
    
    shell.openExternal(shareUrl).catch(err => {
      log.error('Native Shell execution failed:', err);
    });
  } catch (err) {
    log.error('Native Share Hub Exception:', err);
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});