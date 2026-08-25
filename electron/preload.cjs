const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectExe: () => ipcRenderer.invoke('dialog:selectExe'),
  selectImage: () => ipcRenderer.invoke('dialog:selectImage'),
  checkRunning: (exePath) => ipcRenderer.invoke('process:checkRunning', exePath),
  checkUpdate: () => ipcRenderer.invoke('app:checkUpdate'),
  launchProfile: (payload) => ipcRenderer.invoke('launch:runProfile', payload),
  onLaunchStatus: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('launch:status', subscription);
    return () => ipcRenderer.removeListener('launch:status', subscription);
  },
  onManualUpdateResult: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('app:manualUpdateResult', subscription);
    return () => ipcRenderer.removeListener('app:manualUpdateResult', subscription);
  }
});
