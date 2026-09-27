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

  getClientNotes: (clientId: string) => ipcRenderer.invoke('notes:get', { clientId }),
  createClientNote: (clientId: string, data: any) => ipcRenderer.invoke('notes:create', { clientId, data }),
  deleteClientNote: (clientId: string, noteId: number) => ipcRenderer.invoke('notes:delete', { clientId, noteId }),

  getClientPayments: (clientId: string) => ipcRenderer.invoke('payments:get', { clientId }),
  createClientPayment: (clientId: string, data: any) => ipcRenderer.invoke('payments:create', { clientId, data }),
  updateClientPayment: (clientId: string, paymentId: number, data: any) => ipcRenderer.invoke('payments:update', { clientId, paymentId, data }),
  deleteClientPayment: (clientId: string, paymentId: number) => ipcRenderer.invoke('payments:delete', { clientId, paymentId }),

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
