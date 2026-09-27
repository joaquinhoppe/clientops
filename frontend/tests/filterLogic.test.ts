import { describe, it, expect } from 'vitest';
import { filterClients } from '../src/utils/filterLogic';
import { Client } from '../src/types';

const mockClients: Client[] = [
  {
    client_id: '1',
    name: 'Acme Corp',
    project_url: 'https://acme.com',
    status: { is_online: true, last_checked: '' },
    billing: { total_due: 250, currency: 'USD', status: 'overdue' },
    software: { current_version: 'v1.0.0', last_update: '' },
  },
  {
    client_id: '2',
    name: 'Beta LLC',
    project_url: 'https://beta.com',
    status: { is_online: false, last_checked: '' },
    billing: { total_due: 0, currency: 'USD', status: 'paid' },
    software: { current_version: 'v2.0.0', last_update: '' },
  },
  {
    client_id: '3',
    name: 'Gamma Tech',
    project_url: 'https://gamma.com',
    status: { is_online: true, last_checked: '' },
    billing: { total_due: 0, currency: 'USD', status: 'paid' },
    software: { current_version: 'v3.0.0', last_update: '' },
  },
];

describe('filterClients', () => {
  it('filters by search query', () => {
    const result = filterClients(mockClients, 'acme', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
  });

  it('filters by health status: offline only', () => {
    const result = filterClients(mockClients, '', 'offline', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Beta LLC');
  });

  it('filters by billing status: overdue debtors only', () => {
    const result = filterClients(mockClients, '', 'all', 'overdue');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
  });

  it('combines search and filters', () => {
    const result = filterClients(mockClients, 'gamma', 'online', 'paid');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Gamma Tech');
  });
});
