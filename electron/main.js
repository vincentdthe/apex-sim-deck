import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

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

// Select Executable IPC handler
ipcMain.handle('dialog:selectExe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Executable File',
    properties: ['openFile'],
    filters: [
      { name: 'Executables (*.exe, *.bat, *.cmd, *.ps1)', extensions: ['exe', 'bat', 'cmd', 'ps1'] },
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
async function isProcessRunning(exePath) {
  if (!exePath) return false;
  const exeName = path.basename(exePath);
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

// Launch Sequence IPC Handler (Real Native Windows Execution)
ipcMain.handle('launch:runProfile', async (event, payload) => {
  const { profileName, gameName, gameExe, gameArgs, companionApps } = payload;
  const spawnedPids = [];

  const sendStatus = (stepIndex, status, message, pid = null) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launch:status', {
        stepIndex,
        status, // 'pending' | 'running' | 'already_running' | 'completed' | 'error'
        message,
        pid
      });
    }
  };

  try {
    // 1. Launch Companion Apps sequentially with process check & delays
    for (let i = 0; i < companionApps.length; i++) {
      const appItem = companionApps[i];

      if (!appItem.exePath) {
        sendStatus(i, 'error', `Skipped ${appItem.name}: Executable path not set.`);
        continue;
      }

      // Safeguard: Check if app is ALREADY running on Windows
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

      sendStatus(i, 'running', `Starting ${appItem.name}...`);

      try {
        const args = appItem.args ? appItem.args.split(' ').filter(Boolean) : [];
        const child = spawn(appItem.exePath, args, {
          detached: true,
          stdio: 'ignore'
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

    // 2. Launch Main Game Executable (if configured)
    if (!gameExe) {
      // Main game auto-launch skipped or path not set
      if (companionApps.length > 0) {
        sendStatus(companionApps.length, 'completed', `Background companion app sequence finished.`);
      }
      return { success: true, message: 'Companion apps processed' };
    }

    const gameStepIndex = companionApps.length;

    const gameAlreadyRunning = await isProcessRunning(gameExe);
    if (gameAlreadyRunning) {
      sendStatus(gameStepIndex, 'already_running', `${gameName} is already running on your PC.`);
      return { success: true, message: 'Game already running' };
    }

    sendStatus(gameStepIndex, 'running', `Launching main game: ${gameName} (${profileName})...`);

    const gameArgsList = gameArgs ? gameArgs.split(' ').filter(Boolean) : [];
    const gameProc = spawn(gameExe, gameArgsList, {
      detached: true,
      stdio: 'ignore'
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
