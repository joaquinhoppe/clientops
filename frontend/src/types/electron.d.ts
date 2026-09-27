import {
  Client,
  Release,
  AppSettings,
  ClientCreateInput,
  ClientUpdateInput,
  ReleaseCreateInput,
} from './index';

export interface ElectronAPI {
  getClients: () => Promise<Client[]>;
  getClientReleases: (clientId: string) => Promise<Release[]>;
  toggleStatus: (clientId: string) => Promise<{ client_id: string; is_online: boolean; message: string }>;
  createClient: (data: ClientCreateInput) => Promise<Client>;
  updateClient: (clientId: string, data: ClientUpdateInput) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<boolean>;
  createRelease: (clientId: string, data: ReleaseCreateInput) => Promise<Release>;
  deleteRelease: (clientId: string, releaseId: number) => Promise<boolean>;
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
