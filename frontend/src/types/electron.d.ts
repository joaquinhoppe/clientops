import {
  Client,
  Release,
  AppSettings,
  ClientCreateInput,
  ClientUpdateInput,
  ReleaseCreateInput,
  ClientNote,
  ClientNoteCreateInput,
  Payment,
  PaymentCreateInput,
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

  getClientNotes: (clientId: string) => Promise<ClientNote[]>;
  createClientNote: (clientId: string, data: ClientNoteCreateInput) => Promise<ClientNote>;
  deleteClientNote: (clientId: string, noteId: number) => Promise<boolean>;

  getClientPayments: (clientId: string) => Promise<Payment[]>;
  createClientPayment: (clientId: string, data: PaymentCreateInput) => Promise<Payment>;
  updateClientPayment: (clientId: string, paymentId: number, data: { status?: string; paid_at?: string | null; notes?: string }) => Promise<Payment>;
  deleteClientPayment: (clientId: string, paymentId: number) => Promise<boolean>;

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
