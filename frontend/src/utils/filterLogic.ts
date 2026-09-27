import { Client, HealthFilter, BillingFilter } from '../types';

export function filterClients(
  clients: Client[],
  searchQuery: string,
  healthFilter: HealthFilter,
  billingFilter: BillingFilter
): Client[] {
  const query = searchQuery.trim().toLowerCase();

  return clients.filter((client) => {
    // 1. Search Query filter
    if (query) {
      const matchName = client.name.toLowerCase().includes(query);
      const matchUrl = client.project_url.toLowerCase().includes(query);
      if (!matchName && !matchUrl) return false;
    }

    // 2. Health filter
    if (healthFilter === 'online' && !client.status.is_online) return false;
    if (healthFilter === 'offline' && client.status.is_online) return false;

    // 3. Billing filter
    if (billingFilter === 'overdue') {
      const isOverdue = client.billing.status.toLowerCase() === 'overdue' || client.billing.total_due > 0;
      if (!isOverdue) return false;
    }
    if (billingFilter === 'paid') {
      const isPaid = client.billing.status.toLowerCase() === 'paid' && client.billing.total_due === 0;
      if (!isPaid) return false;
    }

    return true;
  });
}
