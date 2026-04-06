const { ipcRenderer, contextBridge } = require('electron');

// Stable bridge injection for both isolated and non-isolated contexts
const bridge = {
  nativeShare: (data) => ipcRenderer.send('native-share', data)
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electronAPI', bridge);
} else {
  window.electronAPI = bridge;
}
