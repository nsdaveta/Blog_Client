const { app, BrowserWindow, protocol, shell, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// GLOBAL SYSTEM HUB (Native Windows 11 Enabled)
app.commandLine.appendSwitch('enable-features', 'WebShare');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('log-level', '3'); 

// Setup logging
log.transports.file.level = 'info';
log.info('Blog App Initializing in Native Share Mode...');

// SYSTEM-LEVEL SWITCHES
if (process.platform === 'win32') {
  app.setAppUserModelId('com.blog.app');
}

// REGISTER CUSTOM PROTOCOL FOR STABLE NATIVE APIS
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
    }
  }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    title: 'Blogify', 
    icon: fs.existsSync(path.join(__dirname, 'dist-temp', 'favicon.png')) 
          ? path.join(__dirname, 'dist-temp', 'favicon.png') 
          : path.join(__dirname, 'public', 'favicon.png'),
    backgroundColor: '#0d0f14',
    webPreferences: {
      nodeIntegration: false, // Node Integration disabled for security
      contextIsolation: true, // MODERN STABILITY Standard
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

  // SMART PROTOCOL HANDLER: Serve from build folders
  protocol.handle('app', async (request) => {
    const urlStr = request.url.replace('app://', '');
    const cleanPath = urlStr.split('?')[0].split('#')[0]; // Remove query/hash
    const fs = require('fs');
    
    // Check various possible locations
    const possiblePaths = [
      path.join(__dirname, 'dist', cleanPath || 'index.html'),
      path.join(__dirname, 'dist-temp', cleanPath || 'index.html'),
      path.join(__dirname, cleanPath || 'index.html')
    ];
    
    let finalPath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        finalPath = p;
        break;
      }
    }
    
    if (!finalPath) {
      log.error(`Protocol Error: File not found for ${request.url}`);
      return new Response('Not Found', { status: 404 });
    }

    const { net } = require('electron');
    const pathToFile = require('url').pathToFileURL(finalPath).toString();
    return net.fetch(pathToFile);
  });

  win.loadURL('app://index.html')
    .catch(err => {
       log.error('Protocol Load Failure:', err);
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

// ── SYSTEM STATE HUB (@ipcMain) ──
ipcMain.on('get-is-packaged', (event) => {
  event.returnValue = app.isPackaged;
});

// A safe stub for native share calls via IPC bridge
ipcMain.on('native-share', async (event, data) => {
  log.info('[IPC] Native Share requested from main process bridge:', data?.title);
  // Optional: In the future, we could trigger OS native share from here
  // For now, we allow the renderer to handle it (or use fallback)
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});