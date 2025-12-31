import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { ApiService, AuthService } from 'teamly_shared';

class FCMService {
  private static unsubscribeOnMessage: (() => void) | null = null;
  private static unsubscribeOnNotificationOpen: (() => void) | null = null;

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('❌ Notification permission denied');
        return false;
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get FCM Token
  static async getDeviceToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('✅ FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Register token with backend
  static async registerToken(): Promise<void> {
    try {
      const deviceToken = await this.getDeviceToken();
      if (!deviceToken) {
        console.log('⚠️ No push token available');
        return;
      }

      const authToken = await AuthService.getToken();
      if (!authToken) {
        console.log('⚠️ User not authenticated');
        return;
      }

      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
      const deviceName = `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`;

      const response = await ApiService.registerFCMToken(
        authToken,
        deviceToken,
        deviceName,
        deviceType
      );

      if (response.success) {
        console.log('✅ Push token registered with backend');
      } else {
        console.log('❌ Failed to register push token:', response.message);
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  // Display notification using Notifee
  static async displayNotification(title: string, body: string, data: any): Promise<void> {
    try {
      console.log('🔔 displayNotification called with:', { title, body, data });
      
      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'messages',
        name: 'Messages',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      
      console.log('✅ Channel created:', channelId);

      // Display notification
      const notificationId = await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId,
          // Use default icon (ic_launcher) instead of custom icon
          smallIcon: 'ic_launcher',
          color: '#E91E63',
          pressAction: {
            id: 'default',
          },
          // Add these for better visibility
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrate: true,
          showTimestamp: true,
        },
        ios: {
          sound: 'default',
        },
      });
      
      console.log('✅ Notification displayed with ID:', notificationId);
    } catch (error) {
      console.error('❌ Error displaying notification:', error);
      console.error('❌ Error details:', JSON.stringify(error));
    }
  }

  // Setup notification listeners
  static setupListeners(onNotificationTap?: (chatId: string) => void): void {
    // Listen for foreground messages
    this.unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('📬 Notification received (foreground):', remoteMessage);
      console.log('📬 Notification title:', remoteMessage.notification?.title);
      console.log('📬 Notification body:', remoteMessage.notification?.body);
      console.log('📬 Notification data:', remoteMessage.data);
      
      // Display notification using Notifee (ALWAYS display, even in foreground)
      if (remoteMessage.notification) {
        console.log('🔔 Displaying notification...');
        try {
          await this.displayNotification(
            remoteMessage.notification.title || 'New Message',
            remoteMessage.notification.body || '',
            remoteMessage.data || {}
          );
          console.log('✅ Notification displayed successfully');
        } catch (error) {
          console.error('❌ Failed to display notification:', error);
        }
      } else {
        console.log('⚠️ No notification object in message');
      }
    });

    // Listen for notification taps (background/quit state)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📬 Notification opened app (background):', remoteMessage);
      
      if (remoteMessage.data?.chatId && onNotificationTap) {
        onNotificationTap(remoteMessage.data.chatId as string);
      }
    });

    // Check if app was opened from a notification (quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📬 Notification opened app (quit state):', remoteMessage);
          
          if (remoteMessage.data?.chatId && onNotificationTap) {
            onNotificationTap(remoteMessage.data.chatId as string);
          }
        }
      });

    // Listen for foreground notification taps (Notifee)
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.chatId && onNotificationTap) {
        onNotificationTap(detail.notification.data.chatId as string);
      }
    });

    console.log('✅ Notification listeners setup complete');
  }

  // Unsubscribe from listeners
  static unsubscribe(): void {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
    }
    console.log('✅ Notification listeners unsubscribed');
  }

  // Unregister token (call on logout)
  static async unregisterToken(): Promise<void> {
    try {
      const deviceToken = await this.getDeviceToken();
      if (!deviceToken) return;

      const authToken = await AuthService.getToken();
      if (!authToken) return;

      await ApiService.unregisterFCMToken(authToken, deviceToken);
      console.log('✅ Push token unregistered');
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }

  // Initialize (call this on app start after login)
  static async initialize(onNotificationTap?: (chatId: string) => void): Promise<void> {
    try {
      console.log('🔵 Initializing Push Notifications...');

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('⚠️ Push notification initialization skipped - no permission');
        return;
      }

      // Register token
      await this.registerToken();

      // Setup listeners
      this.setupListeners(onNotificationTap);

      // Handle token refresh
      messaging().onTokenRefresh(async token => {
        console.log('🔄 FCM Token refreshed:', token);
        // Re-register the new token
        await this.registerToken();
      });

      console.log('✅ Push Notifications initialized successfully');
    } catch (error) {
      console.error('❌ Push notification initialization error:', error);
    }
  }
}

export default FCMService;
