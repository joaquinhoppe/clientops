export interface ClientStatus {
  is_online: boolean;
  last_checked: string;
}

export interface ClientBilling {
  total_due: number;
  currency: string;
  status: 'paid' | 'overdue' | 'pending' | string;
}

export interface ClientSoftware {
  current_version: string;
  last_update: string;
}

export interface Client {
  client_id: string;
  name: string;
  project_url: string;
  status: ClientStatus;
  billing: ClientBilling;
  software: ClientSoftware;
}

export interface Release {
  version: string;
  release_date: string;
  changelog: string[];
}

export interface AppSettings {
  apiUrl: string;
  apiKey: string;
  pollingIntervalSeconds: number;
}

export type HealthFilter = 'all' | 'online' | 'offline';
export type BillingFilter = 'all' | 'overdue' | 'paid';
