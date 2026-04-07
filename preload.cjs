const { ipcRenderer, contextBridge } = require('electron');

// Stable bridge injection for both isolated and non-isolated contexts
const bridge = {
  nativeShare: (data) => ipcRenderer.send('native-share', data),
  isPackaged: ipcRenderer.sendSync('get-is-packaged')
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electronAPI', bridge);
} else {
  window.electronAPI = bridge;
}
