import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectExe: () => ipcRenderer.invoke('dialog:selectExe'),
  launchProfile: (payload) => ipcRenderer.invoke('launch:runProfile', payload),
  onLaunchStatus: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('launch:status', subscription);
    return () => ipcRenderer.removeListener('launch:status', subscription);
  }
});
