import { Client, Release, AppSettings } from './index';

export interface ElectronAPI {
  getClients: () => Promise<Client[]>;
  getClientReleases: (clientId: string) => Promise<Release[]>;
  toggleStatus: (clientId: string) => Promise<{ client_id: string; is_online: boolean; message: string }>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  onClientsUpdated: (callback: (clients: Client[]) => void) => () => void;
  onConnectionStatus: (callback: (status: { isConnected: boolean; error?: string }) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
