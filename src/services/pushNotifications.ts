import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NotificationOptions {
  enableNearbyMessages: boolean;
  notificationRadius: number; // in meters
  enableFollowerUpdates: boolean;
  enableReactions: boolean;
  enableTrendingAlerts: boolean;
}

class PushNotificationService {
  private permission: NotificationPermission = 'default';
  private watchId: number | null = null;
  private userLocation: GeolocationPosition | null = null;
  private notificationOptions: NotificationOptions = {
    enableNearbyMessages: true,
    notificationRadius: 500,
    enableFollowerUpdates: true,
    enableReactions: true,
    enableTrendingAlerts: true
  };
  private notifiedMessages: Set<string> = new Set();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      toast({
        title: 'Notifications Not Supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive'
      });
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      
      if (this.permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive notifications for nearby Los',
        });
        await this.subscribeToPush();
        this.startLocationTracking();
        return true;
      } else {
        toast({
          title: 'Notifications Disabled',
          description: 'You can enable notifications in your browser settings',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private async subscribeToPush() {
    if (!this.serviceWorkerRegistration) return;

    try {
      // Check if already subscribed
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BKagOI0KJq7YJ_XEXq1kBg2Xs-WdPxDKxiZZe3XBr4UzSZE-xx9MuvIV5hnhZ3lO9Vcnc5r_1xPbpHJknbKWjxM';
        const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Save subscription to database
      await this.saveSubscription(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async saveSubscription(subscription: PushSubscription) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: JSON.stringify(subscription),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  startLocationTracking() {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.userLocation = position;
        this.checkNearbyMessages();
      },
      (error) => {
        console.error('Error tracking location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  stopLocationTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private async checkNearbyMessages() {
    if (!this.userLocation || !this.notificationOptions.enableNearbyMessages) return;

    const { latitude, longitude } = this.userLocation.coords;
    
    // Query nearby messages from Supabase
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, profiles!messages_user_id_fkey(name, avatar_url)')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .eq('is_public', true);

    if (error) {
      console.error('Error fetching nearby messages:', error);
      return;
    }

    messages?.forEach(message => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        message.lat,
        message.lng
      );

      // Check if message is within notification radius and not already notified
      if (distance <= this.notificationOptions.notificationRadius && 
          !this.notifiedMessages.has(message.id)) {
        this.sendNearbyMessageNotification(message, distance);
        this.notifiedMessages.add(message.id);
      }
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private sendNearbyMessageNotification(message: any, distance: number) {
    if (this.permission !== 'granted') return;

    const distanceText = distance < 100 ? 
      `${Math.round(distance)}m away` : 
      `${(distance / 1000).toFixed(1)}km away`;

    const notification = new Notification(`New Lo ${distanceText}`, {
      body: `${message.profiles?.name || 'Someone'}: ${message.content}`,
      icon: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
      badge: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
      tag: `message-${message.id}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        messageId: message.id,
        lat: message.lat,
        lng: message.lng
      }
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to the message location on the map
      window.dispatchEvent(new CustomEvent('navigate-to-message', {
        detail: { lat: message.lat, lng: message.lng, messageId: message.id }
      }));
      notification.close();
    };
  }

  async sendReactionNotification(reaction: { userId: string, userName: string, emoji: string, messageContent: string }) {
    if (this.permission !== 'granted' || !this.notificationOptions.enableReactions) return;

    new Notification('New Reaction on Your Lo', {
      body: `${reaction.userName} reacted ${reaction.emoji} to "${reaction.messageContent}"`,
      icon: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
      tag: `reaction-${Date.now()}`,
      vibrate: [100]
    });
  }

  async sendFollowerNotification(follower: { userId: string, userName: string, avatarUrl?: string }) {
    if (this.permission !== 'granted' || !this.notificationOptions.enableFollowerUpdates) return;

    new Notification('New Follower', {
      body: `${follower.userName} started following you`,
      icon: follower.avatarUrl || '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
      tag: `follower-${follower.userId}`,
      vibrate: [100, 50, 100]
    });
  }

  async sendTrendingNotification(location: { name: string, messageCount: number }) {
    if (this.permission !== 'granted' || !this.notificationOptions.enableTrendingAlerts) return;

    new Notification('Trending Location Near You', {
      body: `${location.name} is trending with ${location.messageCount} new Los`,
      icon: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
      tag: `trending-${location.name}`,
      vibrate: [200]
    });
  }

  updateNotificationOptions(options: Partial<NotificationOptions>) {
    this.notificationOptions = { ...this.notificationOptions, ...options };
  }

  clearNotifiedMessages() {
    this.notifiedMessages.clear();
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isLocationTracking(): boolean {
    return this.watchId !== null;
  }
}

export const pushNotificationService = new PushNotificationService();