export interface ClientBrief {
  client_id: string;
  name: string;
  status: {
    is_online: boolean;
    last_checked: string;
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
