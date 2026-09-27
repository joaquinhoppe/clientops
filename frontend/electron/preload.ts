import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getClients: () => ipcRenderer.invoke('clients:get-all'),
  getClientReleases: (clientId: string) => ipcRenderer.invoke('clients:get-releases', { clientId }),
  toggleStatus: (clientId: string) => ipcRenderer.invoke('clients:toggle-status', { clientId }),
  createClient: (data: any) => ipcRenderer.invoke('clients:create', data),
  updateClient: (clientId: string, data: any) => ipcRenderer.invoke('clients:update', { clientId, data }),
  deleteClient: (clientId: string) => ipcRenderer.invoke('clients:delete', { clientId }),
  createRelease: (clientId: string, data: any) => ipcRenderer.invoke('releases:create', { clientId, data }),
  deleteRelease: (clientId: string, releaseId: number) => ipcRenderer.invoke('releases:delete', { clientId, releaseId }),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  onClientsUpdated: (callback: (clients: any) => void) => {
    const handler = (_event: any, clients: any) => callback(clients);
    ipcRenderer.on('clients:updated', handler);
    return () => {
      ipcRenderer.removeListener('clients:updated', handler);
    };
  },
  onConnectionStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('connection:status', handler);
    return () => {
      ipcRenderer.removeListener('connection:status', handler);
    };
  },
});
