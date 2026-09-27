import { BrowserWindow, Notification } from 'electron';
import { detectOfflineTransitions, ClientBrief } from './pollerLogic';

export class BackgroundPoller {
  private timer: NodeJS.Timeout | null = null;
  private stateMap = new Map<string, boolean>();
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
    // Initial fetch immediately
    this.pollOnce();
    // Schedule periodic polling
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

      // Detect offline transitions and show native notification
      const offlineAlerts = detectOfflineTransitions(this.stateMap, clients);
      for (const alert of offlineAlerts) {
        this.triggerNativeNotification(alert.name);
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
}
