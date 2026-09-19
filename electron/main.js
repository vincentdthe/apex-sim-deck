import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import util from 'util';
import https from 'https';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURRENT_VERSION = '1.0.1';
let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    title: 'ApexLaunch Sim Deck',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
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

// Check if a process is already running on Windows
async function isProcessRunning(targetPath) {
  if (!targetPath) return false;
  const ext = path.extname(targetPath).toLowerCase();
  const fileName = path.basename(targetPath);
  const exeName = (ext === '.ps1' || ext === '.bat' || ext === '.cmd') ? fileName : path.basename(targetPath);

  try {
    const { stdout } = await execPromise(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`);
    return stdout.toLowerCase().includes(exeName.toLowerCase());
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

// Launch Sequence IPC Handler
ipcMain.handle('launch:runProfile', async (event, payload) => {
  const { profileName, gameName, gameExe, gameArgs, companionApps } = payload;
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

    if (!gameExe) {
      if (companionApps.length > 0) {
        sendStatus(companionApps.length, 'completed', `Background app and optimization script sequence finished.`);
      }
      return { success: true, message: 'Companion apps & scripts processed' };
    }

    const gameStepIndex = companionApps.length;

    const gameAlreadyRunning = await isProcessRunning(gameExe);
    if (gameAlreadyRunning) {
      sendStatus(gameStepIndex, 'already_running', `${gameName} is already running on your PC.`);
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

      const autoKillApps = spawnedPids.filter((p) => p.autoKill);
      if (autoKillApps.length > 0) {
        monitorGameProcess(gameProc.pid, gameExe, autoKillApps);
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

function monitorGameProcess(gamePid, gameExePath, autoKillApps) {
  const exeName = path.basename(gameExePath);
  const checkInterval = setInterval(() => {
    exec(`tasklist /FI "PID eq ${gamePid}"`, (err, stdout) => {
      if (err || !stdout.includes(gamePid.toString())) {
        clearInterval(checkInterval);
        console.log(`Game ${exeName} (PID ${gamePid}) exited. Auto-killing helper apps...`);

        autoKillApps.forEach(({ pid, appName }) => {
          exec(`taskkill /PID ${pid} /F`, (killErr) => {
            if (!killErr) {
              console.log(`Auto-killed ${appName} (PID ${pid})`);
            }
          });
        });
      }
    });
  }, 5000);
}
