import { BrowserWindow, Notification } from 'electron';
import { detectOfflineTransitions, detectPaymentAlerts, ClientBrief } from './pollerLogic';

export class BackgroundPoller {
  private timer: NodeJS.Timeout | null = null;
  private stateMap = new Map<string, boolean>();
  private alertedPaymentSet = new Set<string>();
  private window: BrowserWindow | null = null;
  private apiUrl: string;
  private apiKey: string;
  private intervalSeconds: number;
  private isPolling = false;

  constructor(apiUrl: string, apiKey: string, intervalSeconds: number = 30) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.intervalSeconds = Math.max(5, intervalSeconds);
  }

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }

  public updateConfig(apiUrl: string, apiKey: string, intervalSeconds: number) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.intervalSeconds = Math.max(5, intervalSeconds);
    if (this.isPolling) {
      this.stop();
      this.start();
    }
  }

  public start() {
    this.isPolling = true;
    this.pollOnce();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.pollOnce();
    }, this.intervalSeconds * 1000);
  }

  public stop() {
    this.isPolling = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async pollOnce(): Promise<any[]> {
    try {
      const url = `${this.apiUrl}/api/v1/clients`;
      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const clients: ClientBrief[] = await response.json();

      // 1. Detect offline transitions and show native notification (FR-05)
      const offlineAlerts = detectOfflineTransitions(this.stateMap, clients);
      for (const alert of offlineAlerts) {
        this.triggerNativeNotification(alert.name);
      }

      // 2. Detect payment due alerts and notify user if unpaid
      const paymentAlerts = detectPaymentAlerts(this.alertedPaymentSet, clients);
      for (const alert of paymentAlerts) {
        if (alert.billing) {
          this.triggerPaymentNotification(
            alert.name,
            alert.billing.total_due,
            alert.billing.currency,
            alert.billing.payment_due_day
          );
        }
      }

      // Notify renderer with updated data
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('clients:updated', clients);
        this.window.webContents.send('connection:status', { isConnected: true });
      }

      return clients;
    } catch (err: any) {
      // Graceful error state (NFR-04) - notify renderer without crashing
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('connection:status', {
          isConnected: false,
          error: err.message || 'API connection failed',
        });
      }
      return [];
    }
  }

  private triggerNativeNotification(clientName: string) {
    try {
      if (Notification.isSupported()) {
        const notif = new Notification({
          title: 'Client Offline Alert ⚠️',
          body: `Attention: ${clientName} server is now OFFLINE!`,
          urgency: 'critical',
        });
        notif.show();
      }
    } catch (err) {
      console.warn('Native notification failed to display:', err);
    }
  }

  private triggerPaymentNotification(
    clientName: string,
    amount: number,
    currency: string,
    dueDay: number
  ) {
    try {
      if (Notification.isSupported()) {
        const formattedAmount = `${amount} ${currency}`;
        const notif = new Notification({
          title: 'Payment Overdue Alert 💳',
          body: `${clientName} payment of ${formattedAmount} is unpaid (Due on day ${dueDay} of the month).`,
          urgency: 'normal',
        });
        notif.show();
      }
    } catch (err) {
      console.warn('Payment notification failed to display:', err);
    }
  }
}
