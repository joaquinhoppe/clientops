export interface ClientBrief {
  client_id: string;
  name: string;
  status: {
    is_online: boolean;
    last_checked: string;
  };
  billing?: {
    total_due: number;
    currency: string;
    status: string;
    payment_due_day: number;
    recurring_amount: number;
  };
}

export function detectOfflineTransitions(
  stateMap: Map<string, boolean>,
  newClients: ClientBrief[]
): ClientBrief[] {
  const transitions: ClientBrief[] = [];

  for (const client of newClients) {
    const wasOnline = stateMap.get(client.client_id);
    const isNowOnline = client.status.is_online;

    // If client was previously known to be online and is now offline, trigger alert
    if (wasOnline === true && isNowOnline === false) {
      transitions.push(client);
    }

    stateMap.set(client.client_id, isNowOnline);
  }

  return transitions;
}

export function detectPaymentAlerts(
  alertedPaymentSet: Set<string>,
  clients: ClientBrief[],
  currentDayOfMonth: number = new Date().getDate()
): ClientBrief[] {
  const alerts: ClientBrief[] = [];

  for (const client of clients) {
    if (!client.billing) continue;

    const isUnpaid =
      client.billing.status.toLowerCase() === 'overdue' ||
      (client.billing.status.toLowerCase() !== 'paid' && client.billing.total_due > 0);

    const isDueOrPast = currentDayOfMonth >= (client.billing.payment_due_day || 1);

    if (isUnpaid && isDueOrPast) {
      if (!alertedPaymentSet.has(client.client_id)) {
        alerts.push(client);
        alertedPaymentSet.add(client.client_id);
      }
    } else if (!isUnpaid) {
      // If payment is paid, clear from alert set
      alertedPaymentSet.delete(client.client_id);
    }
  }

  return alerts;
}
