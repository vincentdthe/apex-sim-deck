// Unified Cross-Platform API Adapter (Supports both Tauri & Electron seamlessly)

export function getPlatform() {
  if (typeof window !== 'undefined') {
    if (window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_METADATA__) return 'tauri';
    if (window.electronAPI) return 'electron';
  }
  return 'web';
}

export const platform = getPlatform();

async function invokeTauri(cmd, args = {}) {
  if (window.__TAURI__?.invoke) {
    return await window.__TAURI__.invoke(cmd, args);
  }
  if (window.__TAURI__?.tauri?.invoke) {
    return await window.__TAURI__.tauri.invoke(cmd, args);
  }
  return null;
}

export async function selectExe() {
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri') {
    try {
      const selected = await invokeTauri('select_exe_dialog');
      if (selected) return selected;
    } catch (e) {
      console.warn('Tauri select_exe_dialog invoke failed, falling back to dialog API:', e);
      if (window.__TAURI__?.dialog?.open) {
        const fallback = await window.__TAURI__.dialog.open({
          title: 'Select Executable or Script File',
          filters: [
            { name: 'Executables & Scripts (*.exe, *.ps1, *.bat, *.cmd)', extensions: ['exe', 'ps1', 'bat', 'cmd'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          multiple: false
        });
        if (fallback) return fallback;
      }
    }
    return null;
  }

  if (currentPlatform === 'electron' && window.electronAPI?.selectExe) {
    return await window.electronAPI.selectExe();
  }

  const manual = prompt('Enter executable/script full path:');
  return manual || null;
}

import { convertFileSrc } from '@tauri-apps/api/tauri';

export function getImageUrl(source) {
  if (!source || typeof source !== 'string') return '';
  const trimmed = source.trim();
  if (!trimmed) return '';

  // Remote URLs or data URIs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Strip accidental protocol prefixes that might have been saved in the past
  let localPath = trimmed;
  if (localPath.startsWith('asset://')) {
    localPath = localPath.replace(/^asset:\/\/+/, '');
  }
  if (localPath.startsWith('file:///')) {
    localPath = localPath.replace(/^file:\/\/\//, '');
  }

  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri') {
    try {
      return convertFileSrc(localPath);
    } catch (e) {
      const normalized = localPath.replace(/\\/g, '/');
      return `https://asset.localhost/${encodeURI(normalized)}`;
    }
  }

  if (currentPlatform === 'electron') {
    const normalized = localPath.replace(/\\/g, '/');
    return `file:///${normalized}`;
  }

  return localPath;
}

export async function selectImage() {
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri') {
    try {
      const selected = await invokeTauri('select_image_dialog');
      if (selected) {
        return selected.replace(/^asset:\/\/+/, '');
      }
    } catch (e) {
      console.warn('Tauri select_image_dialog invoke failed, falling back to dialog API:', e);
      if (window.__TAURI__?.dialog?.open) {
        const fallback = await window.__TAURI__.dialog.open({
          title: 'Select Game Banner Image',
          filters: [
            { name: 'Image Files (*.png, *.jpg, *.jpeg, *.webp, *.bmp)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          multiple: false
        });
        if (fallback) return fallback.replace(/^asset:\/\/+/, '');
      }
    }
    return null;
  }

  if (currentPlatform === 'electron' && window.electronAPI?.selectImage) {
    const res = await window.electronAPI.selectImage();
    return res ? res.replace(/^file:\/\/\//, '') : null;
  }

  const manual = prompt('Enter banner image URL or local file path:');
  return manual || null;
}

export async function checkRunning(exePath) {
  if (!exePath) return false;
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri') {
    try {
      return await invokeTauri('check_running', { exePath });
    } catch (e) {
      console.error('Tauri check_running error:', e);
      return false;
    }
  }

  if (currentPlatform === 'electron' && window.electronAPI?.checkRunning) {
    return await window.electronAPI.checkRunning(exePath);
  }

  return false;
}

export async function launchProfile(payload) {
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri') {
    try {
      return await invokeTauri('launch_profile', { payload });
    } catch (e) {
      console.error('Tauri launch_profile error:', e);
      return { success: false, message: e?.toString() || 'Tauri launch error' };
    }
  }

  if (currentPlatform === 'electron' && window.electronAPI?.launchProfile) {
    return await window.electronAPI.launchProfile(payload);
  }

  return { success: false, message: 'Running in web preview' };
}

export function onLaunchStatus(callback) {
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri' && window.__TAURI__?.event) {
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

  if (currentPlatform === 'electron' && window.electronAPI?.onLaunchStatus) {
    return window.electronAPI.onLaunchStatus(callback);
  }

  return () => {};
}

export async function checkUpdate() {
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri') {
    try {
      return await invokeTauri('check_update');
    } catch (e) {
      return { success: false, updateAvailable: false, currentVersion: '1.0.1' };
    }
  }

  if (currentPlatform === 'electron' && window.electronAPI?.checkUpdate) {
    return await window.electronAPI.checkUpdate();
  }

  return { success: false, updateAvailable: false, currentVersion: '1.0.1' };
}

export function onManualUpdateTrigger(callback) {
  const currentPlatform = getPlatform();

  if (currentPlatform === 'tauri' && window.__TAURI__?.event) {
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

  if (currentPlatform === 'electron' && window.electronAPI?.onManualUpdateResult) {
    return window.electronAPI.onManualUpdateResult(callback);
  }

  return () => {};
}
