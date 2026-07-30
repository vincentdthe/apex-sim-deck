import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectExe: () => ipcRenderer.invoke('dialog:selectExe'),
  selectImage: () => ipcRenderer.invoke('dialog:selectImage'),
  checkRunning: (exePath) => ipcRenderer.invoke('process:checkRunning', exePath),
  launchProfile: (payload) => ipcRenderer.invoke('launch:runProfile', payload),
  onLaunchStatus: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('launch:status', subscription);
    return () => ipcRenderer.removeListener('launch:status', subscription);
  }
});
