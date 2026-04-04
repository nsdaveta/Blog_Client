const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable window occlusion tracking to prevent the renderer from being paused 
// when the window is minimized or covered by other windows.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: '#0d0f14',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false,
      backgroundThrottling: false
    }
  });

  // Completely remove the default menu so keyboard shortcuts like Ctrl+Shift+I or F12 are removed
  win.setMenu(null);

  // Prevent developer tools from being opened via shortcut just in case
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
  });

  // Prevent popup windows and unstyled child windows
  // Instead, open external links in the default OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile(path.join(__dirname, 'dist-temp', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
