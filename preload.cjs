const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  nativeShare: (data) => ipcRenderer.send('native-share', data)
});
