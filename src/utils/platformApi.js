// Unified Cross-Platform API Adapter (Supports both Tauri & Electron seamlessly)

const isTauri = typeof window !== 'undefined' && Boolean(window.__TAURI__);
const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);

export const platform = isTauri ? 'tauri' : isElectron ? 'electron' : 'web';

export async function selectExe() {
  if (isTauri && window.__TAURI__?.dialog) {
    const selected = await window.__TAURI__.dialog.open({
      title: 'Select Executable or Script File',
      filters: [
        { name: 'Executables & Scripts (*.exe, *.ps1, *.bat, *.cmd)', extensions: ['exe', 'ps1', 'bat', 'cmd'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      multiple: false
    });
    return selected || null;
  }

  if (isElectron && window.electronAPI?.selectExe) {
    return await window.electronAPI.selectExe();
  }

  const manual = prompt('Enter executable/script full path:');
  return manual || null;
}

export async function selectImage() {
  if (isTauri && window.__TAURI__?.dialog) {
    const selected = await window.__TAURI__.dialog.open({
      title: 'Select Game Banner Image',
      filters: [
        { name: 'Image Files (*.png, *.jpg, *.jpeg, *.webp, *.bmp)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      multiple: false
    });
    if (!selected) return null;
    return `asset://${selected}`;
  }

  if (isElectron && window.electronAPI?.selectImage) {
    return await window.electronAPI.selectImage();
  }

  const manual = prompt('Enter banner image URL or local file path:');
  return manual || null;
}

export async function checkRunning(exePath) {
  if (!exePath) return false;

  if (isTauri && window.__TAURI__?.invoke) {
    return await window.__TAURI__.invoke('check_running', { exePath });
  }

  if (isElectron && window.electronAPI?.checkRunning) {
    return await window.electronAPI.checkRunning(exePath);
  }

  return false;
}

export async function launchProfile(payload) {
  if (isTauri && window.__TAURI__?.invoke) {
    return await window.__TAURI__.invoke('launch_profile', { payload });
  }

  if (isElectron && window.electronAPI?.launchProfile) {
    return await window.electronAPI.launchProfile(payload);
  }

  return { success: false, message: 'Running in web preview' };
}

export function onLaunchStatus(callback) {
  if (isTauri && window.__TAURI__?.event) {
    let unlistenFn = null;
    window.__TAURI__.event.listen('launch:status', (event) => {
      callback(event.payload);
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });
    return () => {
      if (unlistenFn) unlistenFn();
    };
  }

  if (isElectron && window.electronAPI?.onLaunchStatus) {
    return window.electronAPI.onLaunchStatus(callback);
  }

  return () => {};
}

export async function checkUpdate() {
  if (isTauri && window.__TAURI__?.invoke) {
    try {
      return await window.__TAURI__.invoke('check_update');
    } catch (e) {
      return { success: false, updateAvailable: false, currentVersion: '1.0.1' };
    }
  }

  if (isElectron && window.electronAPI?.checkUpdate) {
    return await window.electronAPI.checkUpdate();
  }

  return { success: false, updateAvailable: false, currentVersion: '1.0.1' };
}

export function onManualUpdateTrigger(callback) {
  if (isTauri && window.__TAURI__?.event) {
    let unlistenFn = null;
    window.__TAURI__.event.listen('app:manualUpdateTrigger', async () => {
      const res = await checkUpdate();
      callback(res);
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });
    return () => {
      if (unlistenFn) unlistenFn();
    };
  }

  if (isElectron && window.electronAPI?.onManualUpdateResult) {
    return window.electronAPI.onManualUpdateResult(callback);
  }

  return () => {};
}
