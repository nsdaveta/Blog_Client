const { app, BrowserWindow, protocol, shell, ipcMain, net } = require('electron');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');

// GLOBAL SYSTEM HUB (Native Windows 11 Enabled)
app.commandLine.appendSwitch('enable-features', 'WebShare');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('log-level', '3');

// Setup logging
log.transports.file.level = 'info';
log.info('Blog App Initializing in Dynamic Discovery Mode...');

// ── DYNAMIC IDENTITY HUB (Secure & Robust) ──
let APP_URL = 'https://blog-app-01.vercel.app';
async function discoverIdentity() {
  return new Promise((resolve) => {
    // 1.5s Discovery Window
    const timeout = setTimeout(() => resolve(), 1500);
    
    net.fetch('https://blog-server-7c1i.onrender.com/blog/client-config')
      .then(async (response) => {
        if (response.ok) {
           const config = await response.json();
           if (config.CLIENT_URL) {
              APP_URL = config.CLIENT_URL;
              log.info(`Dynamic Identity Found: ${APP_URL}`);
           }
        }
        clearTimeout(timeout);
        resolve();
      })
      .catch((e) => {
        log.info('Discovery failed or was cancelled.');
        clearTimeout(timeout);
        resolve();
      });
  });
}

// SYSTEM-LEVEL SWITCHES
if (process.platform === 'win32') {
  app.setAppUserModelId('com.blog.app');
}

// Standard secure contexts already privileged, but we keep protocol hooks clean
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-internal',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
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

  // ── DOMAIN INTERCEPTION: Spoof official domain for Native Share stability ──
  protocol.handle('https', async (request) => {
    if (request.url.startsWith(APP_URL)) {
      const urlStr = request.url.replace(APP_URL, '').split('?')[0].split('#')[0];
      const cleanPath = urlStr || 'index.html';
      
      const possiblePaths = [
        path.join(__dirname, 'dist', cleanPath),
        path.join(__dirname, 'dist-temp', cleanPath),
        path.join(__dirname, cleanPath)
      ];
      
      let finalPath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p) && !fs.lstatSync(p).isDirectory()) {
          finalPath = p;
          break;
        }
      }
      
      // Fallback to index.html for SPA routing
      if (!finalPath) {
        finalPath = fs.existsSync(path.join(__dirname, 'dist', 'index.html')) 
                    ? path.join(__dirname, 'dist', 'index.html') 
                    : path.join(__dirname, 'dist-temp', 'index.html');
      }

      const { net } = require('electron');
      const pathToFile = require('url').pathToFileURL(finalPath).toString();
      return net.fetch(pathToFile);
    }
    
    // Standard internet requests go through normally
    const { net } = require('electron');
    return net.fetch(request, { bypassCustomProtocolHandlers: true });
  });

  win.loadURL(APP_URL)
    .catch(err => {
       log.error('Domain Load Failure:', err);
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

app.whenReady().then(async () => {
  await discoverIdentity();
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});