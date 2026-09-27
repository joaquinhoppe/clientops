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

ipcMain.handle('clients:create', async (_event, clientData) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify(clientData),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  const created = await res.json();
  await poller?.pollOnce();
  return created;
});

ipcMain.handle('clients:update', async (_event, { clientId, data }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  const updated = await res.json();
  await poller?.pollOnce();
  return updated;
});

ipcMain.handle('clients:delete', async (_event, { clientId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'X-API-Key': settings.apiKey,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  await poller?.pollOnce();
  return true;
});

ipcMain.handle('releases:create', async (_event, { clientId, data }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/releases`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  const createdRelease = await res.json();
  await poller?.pollOnce();
  return createdRelease;
});

ipcMain.handle('releases:delete', async (_event, { clientId, releaseId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/releases/${releaseId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'X-API-Key': settings.apiKey,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  await poller?.pollOnce();
  return true;
});

// Client Notes IPC Handlers
ipcMain.handle('notes:get', async (_event, { clientId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/notes`;
  const res = await fetch(url, {
    headers: {
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
});

ipcMain.handle('notes:create', async (_event, { clientId, data }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/notes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
});

ipcMain.handle('notes:delete', async (_event, { clientId, noteId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/notes/${noteId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'X-API-Key': settings.apiKey,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
});

// Client Payments IPC Handlers
ipcMain.handle('payments:get', async (_event, { clientId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/payments`;
  const res = await fetch(url, {
    headers: {
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
});

ipcMain.handle('payments:create', async (_event, { clientId, data }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/payments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const created = await res.json();
  await poller?.pollOnce();
  return created;
});

ipcMain.handle('payments:update', async (_event, { clientId, paymentId, data }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/payments/${paymentId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const updated = await res.json();
  await poller?.pollOnce();
  return updated;
});

ipcMain.handle('payments:delete', async (_event, { clientId, paymentId }) => {
  const settings = loadSettings();
  const url = `${settings.apiUrl.replace(/\/$/, '')}/api/v1/clients/${clientId}/payments/${paymentId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'X-API-Key': settings.apiKey,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await poller?.pollOnce();
  return true;
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
