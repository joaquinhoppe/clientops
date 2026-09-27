import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadSettings, saveSettings } from './safeStorage';
import { BackgroundPoller } from './poller';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let poller: BackgroundPoller | null = null;

function createWindow() {
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.mjs'))
    ? path.join(__dirname, 'preload.mjs')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'ClientOps - Web Clients Monitoring',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load active configuration
  const settings = loadSettings();
  poller = new BackgroundPoller(settings.apiUrl, settings.apiKey, settings.pollingIntervalSeconds);
  poller.setWindow(mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    poller?.start();
  });

  mainWindow.on('closed', () => {
    poller?.stop();
    mainWindow = null;
  });
}

// IPC Handlers (NFR-01: renderer never makes direct HTTP requests)
ipcMain.handle('clients:get-all', async () => {
  if (!poller) {
    const settings = loadSettings();
    poller = new BackgroundPoller(settings.apiUrl, settings.apiKey, settings.pollingIntervalSeconds);
  }
  return await poller.pollOnce();
});

ipcMain.handle('clients:get-releases', async (_event, { clientId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/releases`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-API-Key': settings.apiKey,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error(`Failed to fetch releases for client ${clientId}:`, err);
    return [];
  }
});

ipcMain.handle('clients:toggle-status', async (_event, { clientId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/toggle-status`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': settings.apiKey,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Refresh poller immediately so UI and notifications respond instantly
    await poller?.pollOnce();
    return data;
  } catch (err: any) {
    console.error(`Failed to toggle status for client ${clientId}:`, err);
    throw err;
  }
});

ipcMain.handle('settings:get', async () => {
  return loadSettings();
});

ipcMain.handle('settings:save', async (_event, newSettings) => {
  const success = saveSettings(
    newSettings.apiUrl,
    newSettings.apiKey,
    newSettings.pollingIntervalSeconds
  );
  if (success && poller) {
    poller.updateConfig(
      newSettings.apiUrl,
      newSettings.apiKey,
      newSettings.pollingIntervalSeconds
    );
  }
  return success;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  poller?.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
