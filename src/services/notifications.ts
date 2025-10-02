import { 
  PushNotifications, 
  PushNotificationSchema, 
  ActionPerformed,
  PushNotificationToken,
  PermissionStatus
} from '@capacitor/push-notifications';
import { PlatformService } from './platform';
import { eventBus } from '@/utils/eventBus';

export interface NotificationPermission {
  receive: 'granted' | 'denied' | 'prompt';
}

export interface LocalNotification {
  id: number;
  title: string;
  body: string;
  schedule?: {
    at: Date;
  };
  sound?: string;
  attachments?: Array<{
    id: string;
    url: string;
    options?: any;
  }>;
  actionTypeId?: string;
  extra?: any;
}

export class NotificationService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized || !PlatformService.isNative()) {
      return;
    }

    try {
      // Request permission to use push notifications
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      }

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token: PushNotificationToken) => {
        console.log('Push registration success, token: ' + token.value);
        // Send token to your server for push notifications
        this.sendTokenToServer(token.value);
      });

      // Some issue with our setup and push will not work
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
        this.handleForegroundNotification(notification);
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
        this.handleNotificationAction(notification);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('NotificationService initialization error:', error);
    }
  }

  static async checkPermissions(): Promise<NotificationPermission> {
    try {
      if (PlatformService.isNative()) {
        const permStatus = await PushNotifications.checkPermissions();
        return {
          receive: permStatus.receive
        };
      } else {
        // Web fallback - check Notification API
        if ('Notification' in window) {
          return {
            receive: Notification.permission as 'granted' | 'denied' | 'default'
          };
        }
        return { receive: 'denied' };
      }
    } catch (error) {
      console.error('NotificationService checkPermissions error:', error);
      return { receive: 'denied' };
    }
  }

  static async requestPermissions(): Promise<NotificationPermission> {
    try {
      if (PlatformService.isNative()) {
        const permStatus = await PushNotifications.requestPermissions();
        return {
          receive: permStatus.receive
        };
      } else {
        // Web fallback
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return {
            receive: permission as 'granted' | 'denied'
          };
        }
        return { receive: 'denied' };
      }
    } catch (error) {
      console.error('NotificationService requestPermissions error:', error);
      return { receive: 'denied' };
    }
  }

  static async showLocalNotification(notification: LocalNotification): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        await LocalNotifications.schedule({
          notifications: [{
            title: notification.title,
            body: notification.body,
            id: notification.id,
            schedule: notification.schedule,
            sound: notification.sound || 'default.wav',
            attachments: notification.attachments,
            actionTypeId: notification.actionTypeId,
            extra: notification.extra
          }]
        });
      } else {
        // Web fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico',
            data: notification.extra
          });
        }
      }
    } catch (error) {
      console.error('NotificationService showLocalNotification error:', error);
    }
  }

  static async cancelNotification(id: number): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
          notifications: [{ id: id.toString() }]
        });
      }
    } catch (error) {
      console.error('NotificationService cancelNotification error:', error);
    }
  }

  static async getPendingNotifications(): Promise<any[]> {
    try {
      if (PlatformService.isNative()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.getPending();
        return result.notifications;
      }
      return [];
    } catch (error) {
      console.error('NotificationService getPendingNotifications error:', error);
      return [];
    }
  }

  private static async sendTokenToServer(token: string): Promise<void> {
    try {
      // Send push token to your server
      // This would typically be sent to your Supabase backend
      console.log('Sending push token to server:', token);
      
      // Example: Store token in user profile
      // const { data: { user } } = await supabase.auth.getUser();
      // if (user) {
      //   await supabase
      //     .from('profiles')
      //     .update({ push_token: token })
      //     .eq('id', user.id);
      // }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private static handleForegroundNotification(notification: PushNotificationSchema): void {
    // Handle notification received while app is in foreground
    this.showLocalNotification({
      id: Date.now(),
      title: notification.title || 'New Message',
      body: notification.body || 'You have a new message',
      extra: notification.data
    });
  }

  private static handleNotificationAction(notification: ActionPerformed): void {
    // Handle notification tap/action
    const data = notification.notification.data;
    
    if (data?.messageId) {
      // Navigate to specific message
      eventBus.emit('notificationAction', {
        action: 'view-message',
        messageId: data.messageId,
      });
    }
  }
}