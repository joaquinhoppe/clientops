import { describe, it, expect } from 'vitest';
import { detectOfflineTransitions, detectPaymentAlerts } from '../electron/pollerLogic';

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

describe('detectPaymentAlerts', () => {
  it('alerts when client payment is unpaid and due day has arrived', () => {
    const alertedSet = new Set<string>();
    const clients = [
      {
        client_id: 'c1',
        name: 'Unpaid Client',
        status: { is_online: true, last_checked: '' },
        billing: {
          status: 'overdue',
          total_due: 1500,
          currency: 'USD',
          payment_due_day: 5,
          recurring_amount: 1500,
        },
      },
    ];

    // Current day is 10 (past due day 5)
    const alerts = detectPaymentAlerts(alertedSet, clients as any, 10);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].client_id).toBe('c1');
    expect(alertedSet.has('c1')).toBe(true);

    // Second check should not duplicate alert
    const secondAlerts = detectPaymentAlerts(alertedSet, clients as any, 10);
    expect(secondAlerts).toHaveLength(0);
  });

  it('does not alert before the due day', () => {
    const alertedSet = new Set<string>();
    const clients = [
      {
        client_id: 'c2',
        name: 'Future Client',
        status: { is_online: true, last_checked: '' },
        billing: {
          status: 'pending',
          total_due: 1200,
          currency: 'USD',
          payment_due_day: 25,
          recurring_amount: 1200,
        },
      },
    ];

    // Current day is 10 (before due day 25)
    const alerts = detectPaymentAlerts(alertedSet, clients as any, 10);
    expect(alerts).toHaveLength(0);
  });

  it('resets alert state when client becomes paid', () => {
    const alertedSet = new Set<string>(['c3']);
    const clients = [
      {
        client_id: 'c3',
        name: 'Paid Client',
        status: { is_online: true, last_checked: '' },
        billing: {
          status: 'paid',
          total_due: 0,
          currency: 'USD',
          payment_due_day: 5,
          recurring_amount: 1000,
        },
      },
    ];

    detectPaymentAlerts(alertedSet, clients as any, 10);
    expect(alertedSet.has('c3')).toBe(false);
  });
});
