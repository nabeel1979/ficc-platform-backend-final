const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    openNAPS2: (opts) => ipcRenderer.invoke('open-naps2', opts),
    monitorFolder: (opts) => ipcRenderer.invoke('monitor-folder', opts),
    uploadFile: (opts) => ipcRenderer.invoke('upload-file', opts),
    onProtocolUrl: (callback) => ipcRenderer.on('protocol-url', (_, url) => callback(url)),
    onStartMonitor: (callback) => ipcRenderer.on('start-monitor', (_, data) => callback(data))
  });
  console.log('Preload: electronAPI exposed successfully');
} catch (error) {
  console.error('Preload error:', error);
}
