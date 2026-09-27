export interface ClientStatus {
  is_online: boolean;
  last_checked: string;
}

export interface ClientBilling {
  total_due: number;
  currency: string;
  status: 'paid' | 'overdue' | 'pending' | string;
  payment_due_day: number;
  recurring_amount: number;
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

export interface ClientCreateInput {
  name: string;
  project_url: string;
  is_online?: boolean;
  total_due?: number;
  currency?: string;
  billing_status?: string;
  payment_due_day?: number;
  recurring_amount?: number;
  current_version?: string;
  last_update?: string;
}

export interface ClientUpdateInput {
  name?: string;
  project_url?: string;
  is_online?: boolean;
  total_due?: number;
  currency?: string;
  billing_status?: string;
  payment_due_day?: number;
  recurring_amount?: number;
  current_version?: string;
  last_update?: string;
}

export interface Release {
  id?: number;
  version: string;
  release_date: string;
  changelog: string[];
  cost?: number;
}

export interface ReleaseCreateInput {
  version: string;
  release_date?: string;
  changelog: string[];
  cost?: number;
}

export interface ClientNote {
  id: number;
  client_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface ClientNoteCreateInput {
  title?: string;
  content: string;
}

export interface Payment {
  id: number;
  client_id: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'paid' | 'unpaid' | 'overdue' | string;
  paid_at?: string | null;
  notes?: string;
}

export interface PaymentCreateInput {
  amount: number;
  currency?: string;
  due_date: string;
  status?: string;
  paid_at?: string | null;
  notes?: string;
}

export interface AppSettings {
  apiUrl: string;
  apiKey: string;
  pollingIntervalSeconds: number;
}

export type HealthFilter = 'all' | 'online' | 'offline';
export type BillingFilter = 'all' | 'overdue' | 'paid';
