import { describe, it, expect } from 'vitest';
import { detectOfflineTransitions } from '../electron/pollerLogic';

describe('detectOfflineTransitions', () => {
  it('detects when an online client goes offline', () => {
    const previousState = new Map<string, boolean>([
      ['client-1', true],
      ['client-2', true],
    ]);

    const newClients = [
      { client_id: 'client-1', name: 'Client 1', status: { is_online: false, last_checked: '' } },
      { client_id: 'client-2', name: 'Client 2', status: { is_online: true, last_checked: '' } },
    ];

    const offlineAlerts = detectOfflineTransitions(previousState, newClients as any);

    expect(offlineAlerts).toHaveLength(1);
    expect(offlineAlerts[0].client_id).toBe('client-1');
    expect(offlineAlerts[0].name).toBe('Client 1');
  });

  it('does not trigger alert if client was already offline', () => {
    const previousState = new Map<string, boolean>([
      ['client-1', false],
    ]);

    const newClients = [
      { client_id: 'client-1', name: 'Client 1', status: { is_online: false, last_checked: '' } },
    ];

    const offlineAlerts = detectOfflineTransitions(previousState, newClients as any);
    expect(offlineAlerts).toHaveLength(0);
  });

  it('updates state map with new status', () => {
    const state = new Map<string, boolean>();
    const newClients = [
      { client_id: 'client-1', name: 'Client 1', status: { is_online: true, last_checked: '' } },
    ];

    detectOfflineTransitions(state, newClients as any);
    expect(state.get('client-1')).toBe(true);
  });
});
