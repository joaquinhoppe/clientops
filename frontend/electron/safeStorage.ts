import { safeStorage, app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface StoredSettings {
  apiUrl: string;
  encryptedApiKey: string;
  pollingIntervalSeconds: number;
}

const DEFAULT_SETTINGS: StoredSettings = {
  apiUrl: 'http://localhost:8000',
  encryptedApiKey: '',
  pollingIntervalSeconds: 30,
};

function getSettingsPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'clientops-settings.json');
}

export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return '';
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(apiKey);
    return encrypted.toString('base64');
  } else {
    // Fallback if OS Secret Service / DPAPI is not available
    return Buffer.from(apiKey, 'utf-8').toString('base64');
  }
}

export function decryptApiKey(encryptedBase64: string): string {
  if (!encryptedBase64) return '';
  try {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer);
    } else {
      return buffer.toString('utf-8');
    }
  } catch (err) {
    console.error('Failed to decrypt API key:', err);
    return '';
  }
}

export function loadSettings(): { apiUrl: string; apiKey: string; pollingIntervalSeconds: number } {
  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed: StoredSettings = JSON.parse(content);
      return {
        apiUrl: parsed.apiUrl || DEFAULT_SETTINGS.apiUrl,
        apiKey: decryptApiKey(parsed.encryptedApiKey) || 'clientops-secret-key-2026',
        pollingIntervalSeconds: parsed.pollingIntervalSeconds || DEFAULT_SETTINGS.pollingIntervalSeconds,
      };
    }
  } catch (err) {
    console.warn('Could not read settings file, using defaults', err);
  }

  return {
    apiUrl: DEFAULT_SETTINGS.apiUrl,
    apiKey: 'clientops-secret-key-2026',
    pollingIntervalSeconds: DEFAULT_SETTINGS.pollingIntervalSeconds,
  };
}

export function saveSettings(apiUrl: string, apiKey: string, pollingIntervalSeconds: number): boolean {
  const filePath = getSettingsPath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const payload: StoredSettings = {
      apiUrl,
      encryptedApiKey: encryptApiKey(apiKey),
      pollingIntervalSeconds,
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}
