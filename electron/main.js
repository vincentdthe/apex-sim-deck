import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const runningCompanionPids = new Map(); // gameId -> [pids]

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    title: 'ApexLaunch Sim Deck',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production or built Vite dist
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

// Select File Dialog IPC handler
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

// Launch Sequence IPC Handler
ipcMain.handle('launch:runProfile', async (event, payload) => {
  const { profileName, gameName, gameExe, gameArgs, companionApps } = payload;
  const spawnedPids = [];

  const sendStatus = (stepIndex, status, message, pid = null) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launch:status', {
        stepIndex,
        status, // 'pending' | 'running' | 'completed' | 'error'
        message,
        pid
      });
    }
  };

  try {
    // 1. Launch Companion Apps sequentially with configured delays
    for (let i = 0; i < companionApps.length; i++) {
      const appItem = companionApps[i];
      const delayMs = (appItem.delay || 0) * 1000;

      sendStatus(i, 'pending', `Waiting ${appItem.delay || 0}s before starting ${appItem.name}...`);

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      sendStatus(i, 'running', `Starting ${appItem.name}...`);

      if (!appItem.exePath) {
        sendStatus(i, 'error', `Skipped ${appItem.name}: Executable path not set.`);
        continue;
      }

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

    // 2. Launch Main Game Executable
    const gameStepIndex = companionApps.length;
    sendStatus(gameStepIndex, 'running', `Launching main game: ${gameName} (${profileName})...`);

    if (!gameExe) {
      sendStatus(gameStepIndex, 'error', `Main game executable path not configured for ${gameName}.`);
      return { success: false, error: 'Executable path not configured' };
    }

    const gameArgsList = gameArgs ? gameArgs.split(' ').filter(Boolean) : [];
    const gameProc = spawn(gameExe, gameArgsList, {
      detached: true,
      stdio: 'ignore'
    });

    if (gameProc.pid) {
      gameProc.unref();
      sendStatus(gameStepIndex, 'completed', `Started ${gameName} successfully! (PID: ${gameProc.pid})`, gameProc.pid);

      // Track auto-kill companion apps if game monitoring is requested
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

// Process monitoring helper for auto-kill
function monitorGameProcess(gamePid, gameExePath, autoKillApps) {
  const exeName = path.basename(gameExePath);
  const checkInterval = setInterval(() => {
    // Check if process is still running on Windows
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
