export interface OfflineAction {
  id: string;
  type: 'CREATE_BOOKING' | 'UPDATE_PROFILE' | 'ADD_WALLET_FUNDS';
  data: any;
  timestamp: number;
}

export interface NotificationPermission {
  granted: boolean;
  permission: NotificationPermission;
}

class PWAService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private offlineActions: OfflineAction[] = [];

  constructor() {
    this.initializeServiceWorker();
    this.setupEventListeners();
    this.loadOfflineActions();
  }

  // Initialize service worker
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', this.swRegistration);

        // Handle service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Setup event listeners
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionChange(false);
    });
  }

  // Handle connection changes
  private onConnectionChange(isOnline: boolean) {
    if (isOnline) {
      this.syncOfflineActions();
      this.updateLastSync();
    }
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('connectionChange', { 
      detail: { isOnline } 
    }));
  }

  // Show update notification
  private showUpdateNotification() {
    if (confirm('A new version is available. Would you like to update?')) {
      this.updateApp();
    }
  }

  // Update the app
  private updateApp() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      window.addEventListener('load', () => {
        window.location.reload();
      });
    }
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'CACHE_STATUS':
        console.log('Cache status:', data.caches);
        break;
      case 'OFFLINE_ACTION_STORED':
        console.log('Offline action stored:', data.action);
        break;
      default:
        console.log('Unknown service worker message:', data);
    }
  }

  // Check if app is installable
  async isInstallable(): Promise<boolean> {
    if (!this.swRegistration) return false;

    const deferredPrompt = await this.getDeferredPrompt();
    return !!deferredPrompt;
  }

  // Install the app
  async installApp(): Promise<boolean> {
    const deferredPrompt = await this.getDeferredPrompt();
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('App installed successfully');
        return true;
      }
    }
    
    return false;
  }

  // Get deferred prompt
  private async getDeferredPrompt(): Promise<any> {
    return new Promise((resolve) => {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        resolve(e);
      }, { once: true });
    });
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return { granted: false, permission: 'denied' };
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted', permission };
    }

    return { 
      granted: Notification.permission === 'granted', 
      permission: Notification.permission 
    };
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const permission = await this.requestNotificationPermission();
      if (!permission.granted) {
        console.log('Notification permission denied');
        return null;
      }

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push notification subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Send push notification
  async sendPushNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.swRegistration) return;

    try {
      await this.swRegistration.showNotification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [100, 50, 100],
        ...options
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // Store offline action
  async storeOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    this.offlineActions.push(offlineAction);
    this.saveOfflineActions();

    // Send to service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STORE_OFFLINE_ACTION',
        action: offlineAction
      });
    }

    return offlineAction.id;
  }

  // Get offline actions
  getOfflineActions(): OfflineAction[] {
    return [...this.offlineActions];
  }

  // Remove offline action
  removeOfflineAction(id: string): void {
    this.offlineActions = this.offlineActions.filter(action => action.id !== id);
    this.saveOfflineActions();
  }

  // Sync offline actions
  private async syncOfflineActions(): Promise<void> {
    if (this.offlineActions.length === 0) return;

    console.log(`Syncing ${this.offlineActions.length} offline actions...`);

    for (const action of [...this.offlineActions]) {
      try {
        await this.processOfflineAction(action);
        this.removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }
  }

  // Process offline action
  private async processOfflineAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_BOOKING':
        await this.createBooking(action.data);
        break;
      case 'UPDATE_PROFILE':
        await this.updateProfile(action.data);
        break;
      case 'ADD_WALLET_FUNDS':
        await this.addWalletFunds(action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // API functions for offline actions
  private async createBooking(bookingData: any): Promise<void> {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error('Failed to create booking');
    }
  }

  private async updateProfile(profileData: any): Promise<void> {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
  }

  private async addWalletFunds(fundsData: any): Promise<void> {
    const response = await fetch('/api/wallet/add-funds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(fundsData)
    });

    if (!response.ok) {
      throw new Error('Failed to add wallet funds');
    }
  }

  // Get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  // Load offline actions from storage
  private loadOfflineActions(): void {
    try {
      const stored = localStorage.getItem('offlineActions');
      this.offlineActions = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline actions:', error);
      this.offlineActions = [];
    }
  }

  // Save offline actions to storage
  private saveOfflineActions(): void {
    try {
      localStorage.setItem('offlineActions', JSON.stringify(this.offlineActions));
      localStorage.setItem('offlineActionsCount', this.offlineActions.length.toString());
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  }

  // Update last sync timestamp
  private updateLastSync(): void {
    localStorage.setItem('lastSync', Date.now().toString());
  }

  // Get connection status
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get cache status
  async getCacheStatus(): Promise<string[]> {
    if (!('caches' in window)) return [];

    try {
      return await caches.keys();
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return [];
    }
  }

  // Clear cache
  async clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Get app info
  getAppInfo() {
    return {
      isOnline: this.isOnline,
      isInstallable: this.isInstallable(),
      offlineActionsCount: this.offlineActions.length,
      lastSync: localStorage.getItem('lastSync'),
      serviceWorkerRegistered: !!this.swRegistration
    };
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Register periodic background sync
  async registerPeriodicSync(): Promise<boolean> {
    if (!('periodicSync' in navigator.serviceWorker)) {
      console.log('Periodic background sync not supported');
      return false;
    }

    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any
      });

      if (status.state === 'granted') {
        await (navigator.serviceWorker.ready as any).then((registration: any) => {
          return registration.periodicSync.register('periodic-sync', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          });
        });
        console.log('Periodic background sync registered');
        return true;
      }
    } catch (error) {
      console.error('Failed to register periodic sync:', error);
    }

    return false;
  }

  // Unregister periodic background sync
  async unregisterPeriodicSync(): Promise<boolean> {
    if (!('periodicSync' in navigator.serviceWorker)) {
      return false;
    }

    try {
      await (navigator.serviceWorker.ready as any).then((registration: any) => {
        return registration.periodicSync.unregister('periodic-sync');
      });
      console.log('Periodic background sync unregistered');
      return true;
    } catch (error) {
      console.error('Failed to unregister periodic sync:', error);
      return false;
    }
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;