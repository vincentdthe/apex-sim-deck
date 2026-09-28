import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import util from 'util';
import https from 'https';

process.on('uncaughtException', (err) => {
  console.error('Electron uncaught exception:', err);
});

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURRENT_VERSION = '1.0.1';
let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const iconPath = path.join(__dirname, '../build/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    title: 'ApexLaunch Sim Deck',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  setupNativeMenu();
}

function setupNativeMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: async () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              const res = await checkGitHubUpdate();
              mainWindow.webContents.send('app:manualUpdateResult', res);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/vincentdthe/apex-sim-deck');
          }
        },
        {
          label: 'About ApexLaunch Sim Deck',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ApexLaunch Sim Deck',
              message: `ApexLaunch Sim Deck v${CURRENT_VERSION}`,
              detail: 'Modern Sim Racing & Flight Sim Launcher.\nCreated for automated multi-app launch chaining and profile management.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helper function to check GitHub updates
async function checkGitHubUpdate() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/vincentdthe/apex-sim-deck/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'ApexLaunch-Sim-Deck-App'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const release = JSON.parse(data);
            const latestVersion = (release.tag_name || '').replace(/^v/, '');
            const updateAvailable = compareVersions(latestVersion, CURRENT_VERSION) > 0;
            const asset = (release.assets || []).find(a => a.name.endsWith('.zip'));

            resolve({
              success: true,
              currentVersion: CURRENT_VERSION,
              latestVersion: release.tag_name || latestVersion,
              updateAvailable,
              releaseNotes: release.body || 'No release notes provided.',
              downloadUrl: asset ? asset.browser_download_url : release.html_url,
              releaseUrl: release.html_url
            });
          } else {
            resolve({ success: false, currentVersion: CURRENT_VERSION, updateAvailable: false, message: 'Could not fetch release info.' });
          }
        } catch (e) {
          resolve({ success: false, currentVersion: CURRENT_VERSION, updateAvailable: false, message: e.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, currentVersion: CURRENT_VERSION, updateAvailable: false, message: err.message });
    });

    req.end();
  });
}

// Auto-Updater IPC Handler
ipcMain.handle('app:checkUpdate', async () => {
  return await checkGitHubUpdate();
});

// Helper function to compare semver strings
function compareVersions(v1, v2) {
  const p1 = (v1 || '').split('.').map(Number);
  const p2 = (v2 || '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

// Select Executable / Script IPC handler
ipcMain.handle('dialog:selectExe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Executable or Script File',
    properties: ['openFile'],
    filters: [
      { name: 'Executables & Scripts (*.exe, *.ps1, *.bat, *.cmd)', extensions: ['exe', 'ps1', 'bat', 'cmd'] },
      { name: 'PowerShell Scripts (*.ps1)', extensions: ['ps1'] },
      { name: 'Batch Files (*.bat, *.cmd)', extensions: ['bat', 'cmd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Select Image File IPC handler
ipcMain.handle('dialog:selectImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Game Banner Image',
    properties: ['openFile'],
    filters: [
      { name: 'Image Files (*.png, *.jpg, *.jpeg, *.webp, *.bmp)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  return `file:///${filePath.replace(/\\/g, '/')}`;
});

// Check if a process is already running on Windows (Exact process name match)
async function isProcessRunning(targetPath) {
  if (!targetPath) return false;
  const fileName = path.basename(targetPath).toLowerCase();
  const truncatedName = fileName.slice(0, 25);

  try {
    const { stdout } = await execPromise('tasklist /FO CSV /NH');
    const lines = stdout.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^"([^"]+)"/);
      if (match) {
        const runningImage = match[1].toLowerCase();
        if (runningImage === fileName || runningImage === truncatedName) {
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

ipcMain.handle('process:checkRunning', async (event, exePath) => {
  return await isProcessRunning(exePath);
});

// Helper function to spawn Executables (.exe) or Scripts (.ps1, .bat, .cmd)
function spawnProcessOrScript(targetPath, rawArgs = '') {
  const ext = path.extname(targetPath).toLowerCase();
  const userArgs = rawArgs ? rawArgs.split(' ').filter(Boolean) : [];
  const parentDir = path.dirname(targetPath);

  if (ext === '.ps1') {
    return spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      targetPath,
      ...userArgs
    ], { 
      cwd: parentDir,
      detached: true, 
      stdio: 'ignore',
      windowsHide: true
    });
  } else if (ext === '.bat' || ext === '.cmd') {
    return spawn('cmd.exe', [
      '/c',
      targetPath,
      ...userArgs
    ], { 
      cwd: parentDir,
      detached: true, 
      stdio: 'ignore',
      windowsHide: true
    });
  } else {
    return spawn(targetPath, userArgs, {
      cwd: parentDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
  }
}

// Helper function to check if any session process is running
async function getRunningSessionProcess(sessionProcesses) {
  if (!Array.isArray(sessionProcesses) || sessionProcesses.length === 0) return null;
  try {
    const { stdout } = await execPromise('tasklist /FO CSV /NH');
    const lines = stdout.split(/\r?\n/);
    const runningImages = new Set();
    for (const line of lines) {
      const match = line.match(/^"([^"]+)"/);
      if (match) {
        runningImages.add(match[1].toLowerCase());
      }
    }
    for (const proc of sessionProcesses) {
      const p = proc.toLowerCase().trim();
      const pTrunc = p.slice(0, 25);
      if (runningImages.has(p) || runningImages.has(pTrunc)) {
        return proc;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Helper function to check if a specific PID is running
async function isPidRunning(pid) {
  if (!pid) return false;
  try {
    const { stdout } = await execPromise(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
    return stdout.includes(pid.toString());
  } catch (e) {
    return false;
  }
}

// Terminate companion apps marked with autoKill
async function terminateAutoKillApps(autoKillApps) {
  for (const app of autoKillApps) {
    if (app.pid) {
      try {
        await execPromise(`taskkill /PID ${app.pid} /T /F`);
      } catch (e) {}
    }
    if (app.exePath) {
      const exeName = path.basename(app.exePath);
      try {
        await execPromise(`taskkill /IM "${exeName}" /T /F`);
      } catch (e) {}
    }
  }
}

// Background Simulation Session Monitor
function monitorSimulationSession(win, gamePid, gameExe, gameName, sessionProcesses, autoKillApps, stepIndex) {
  if (!autoKillApps || autoKillApps.length === 0) return;

  const sendStatus = (status, message, pid = null) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('launch:status', {
        stepIndex,
        status,
        message,
        pid,
        name: 'Session Monitor & Auto-Close'
      });
    }
  };

  const monitoredDisplay = sessionProcesses && sessionProcesses.length > 0
    ? sessionProcesses.slice(0, 2).join(', ')
    : (gameExe ? path.basename(gameExe) : gameName);

  sendStatus('running', `Session Monitor Active: Watching for ${gameName} session (${monitoredDisplay}). Auto-close armed for ${autoKillApps.length} companion app(s).`);

  let sessionActive = false;
  let activeProcessName = '';
  let pollCount = 0;

  const interval = setInterval(async () => {
    pollCount++;
    try {
      // 1. Check if any simulation session process is running
      const runningSessionExe = await getRunningSessionProcess(sessionProcesses);

      if (runningSessionExe) {
        if (!sessionActive) {
          sessionActive = true;
          activeProcessName = runningSessionExe;
          sendStatus('running', `Simulation Session ACTIVE (${runningSessionExe} detected). Auto-close armed.`);
        }
        return;
      }

      // 2. If session process not detected, check if launcher is still running
      const launcherRunning =
        (gamePid && (await isPidRunning(gamePid))) ||
        (gameExe && (await isProcessRunning(gameExe)));

      if (launcherRunning) {
        if (!sessionActive && pollCount % 4 === 0) {
          sendStatus('running', `Monitoring: Launcher active. Waiting for in-game session to start...`);
        }
        return;
      }

      // 3. Neither session process nor launcher is running
      if (sessionActive) {
        clearInterval(interval);
        sendStatus('running', `Simulation session exited (${activeProcessName || gameName}). Auto-closing helper apps...`);

        await terminateAutoKillApps(autoKillApps);

        sendStatus('completed', `Session ended. Auto-closed ${autoKillApps.length} companion app(s).`);
      } else {
        // Launcher exited without entering session (allow 10s grace period)
        if (pollCount >= 4) {
          clearInterval(interval);
          sendStatus('running', `Simulation launcher closed. Auto-closing helper apps...`);

          await terminateAutoKillApps(autoKillApps);

          sendStatus('completed', `Auto-close complete.`);
        }
      }
    } catch (err) {
      console.error('Session monitor error:', err);
    }
  }, 2500);
}

// Launch Sequence IPC Handler
ipcMain.handle('launch:runProfile', async (event, payload) => {
  const { profileName, gameName, gameExe, gameArgs, sessionProcesses, companionApps } = payload;
  const spawnedPids = [];

  const sendStatus = (stepIndex, status, message, pid = null) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launch:status', {
        stepIndex,
        status,
        message,
        pid
      });
    }
  };

  try {
    for (let i = 0; i < companionApps.length; i++) {
      const appItem = companionApps[i];

      if (!appItem.exePath) {
        sendStatus(i, 'error', `Skipped ${appItem.name}: File path not set.`);
        continue;
      }

      if (!fs.existsSync(appItem.exePath)) {
        sendStatus(i, 'error', `File not found on disk: "${appItem.exePath}". Please edit path in Settings.`);
        continue;
      }

      const alreadyRunning = await isProcessRunning(appItem.exePath);
      if (alreadyRunning) {
        sendStatus(i, 'already_running', `${appItem.name} is already running on your PC. Skipping duplicate launch.`);
        continue;
      }

      const delayMs = (appItem.delay || 0) * 1000;
      if (delayMs > 0) {
        sendStatus(i, 'pending', `Waiting ${appItem.delay || 0}s before starting ${appItem.name}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const ext = path.extname(appItem.exePath).toLowerCase();
      const isScript = (ext === '.ps1' || ext === '.bat' || ext === '.cmd');
      sendStatus(i, 'running', `Starting ${isScript ? 'script' : 'app'}: ${appItem.name}...`);

      try {
        const child = spawnProcessOrScript(appItem.exePath, appItem.args);
        child.on('error', (err) => {
          console.error(`Process error for ${appItem.name}:`, err);
          sendStatus(i, 'error', `Error launching ${appItem.name}: ${err.message}`);
        });
        child.unref();

        if (child.pid) {
          spawnedPids.push({ pid: child.pid, appName: appItem.name, autoKill: appItem.autoKill });
          sendStatus(i, 'completed', `Launched ${appItem.name} (PID: ${child.pid})`, child.pid);
        } else {
          sendStatus(i, 'completed', `Launched ${appItem.name}`);
        }
      } catch (err) {
        console.error(`Failed to launch ${appItem.name}:`, err);
        sendStatus(i, 'error', `Failed to start ${appItem.name}: ${err.message}`);
      }
    }

    const autoKillApps = companionApps
      .filter((app) => app.autoKill && app.exePath)
      .map((app) => {
        const spawned = spawnedPids.find((p) => p.appName === app.name);
        return {
          name: app.name,
          exePath: app.exePath,
          pid: spawned ? spawned.pid : null
        };
      });

    if (!gameExe) {
      if (companionApps.length > 0) {
        sendStatus(companionApps.length, 'completed', `Background app and optimization script sequence finished.`);
      }

      if (autoKillApps.length > 0 && sessionProcesses && sessionProcesses.length > 0) {
        const monitorStepIndex = companionApps.length + 1;
        monitorSimulationSession(
          mainWindow,
          null,
          null,
          gameName,
          sessionProcesses,
          autoKillApps,
          monitorStepIndex
        );
      }

      return { success: true, message: 'Companion apps & scripts processed' };
    }

    const gameStepIndex = companionApps.length;

    if (!fs.existsSync(gameExe)) {
      sendStatus(gameStepIndex, 'error', `Game executable not found on disk: "${gameExe}". Please check path.`);
      return { success: false, error: 'Game executable not found on disk' };
    }

    const gameAlreadyRunning = await isProcessRunning(gameExe);
    if (gameAlreadyRunning) {
      sendStatus(gameStepIndex, 'already_running', `${gameName} is already running on your PC.`);
      if (autoKillApps.length > 0) {
        const monitorStepIndex = gameStepIndex + 1;
        monitorSimulationSession(
          mainWindow,
          null,
          gameExe,
          gameName,
          sessionProcesses,
          autoKillApps,
          monitorStepIndex
        );
      }
      return { success: true, message: 'Game already running' };
    }

    sendStatus(gameStepIndex, 'running', `Launching main game: ${gameName} (${profileName})...`);

    const gameProc = spawnProcessOrScript(gameExe, gameArgs);
    gameProc.on('error', (err) => {
      console.error(`Game process error for ${gameName}:`, err);
      sendStatus(gameStepIndex, 'error', `Error launching ${gameName}: ${err.message}`);
    });

    if (gameProc.pid) {
      gameProc.unref();
      sendStatus(gameStepIndex, 'completed', `Started ${gameName} successfully! (PID: ${gameProc.pid})`, gameProc.pid);

      if (autoKillApps.length > 0) {
        const monitorStepIndex = gameStepIndex + 1;
        monitorSimulationSession(
          mainWindow,
          gameProc.pid,
          gameExe,
          gameName,
          sessionProcesses,
          autoKillApps,
          monitorStepIndex
        );
      }

      return { success: true, gamePid: gameProc.pid };
    } else {
      sendStatus(gameStepIndex, 'error', `Could not obtain PID for ${gameName}`);
      return { success: false, error: 'Could not obtain PID' };
    }
  } catch (globalErr) {
    console.error('Launch sequence failed:', globalErr);
    return { success: false, error: globalErr.message };
  }
});
