// Browser Notification Service for Teamly Web
// Handles desktop notifications like WhatsApp Web

import { initializeFirebase, getFCMToken, onForegroundMessage } from '../config/firebase';
import { ApiService, AuthService } from 'teamly_shared';

export class NotificationService {
  private static permission: NotificationPermission = 'default';
  private static notificationSound: HTMLAudioElement | null = null;
  private static fcmToken: string | null = null;
  private static firebaseSupported: boolean = false;

  // Initialize notification service
  static async initialize(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser does not support notifications');
      return false;
    }

    this.permission = Notification.permission;

    // Load notification sound
    if (typeof window !== 'undefined') {
      this.notificationSound = new Audio('/notification.ogg');
      this.notificationSound.volume = 0.5;
    }

    // Initialize Firebase for push notifications (optional - graceful fallback)
    try {
      initializeFirebase();
      this.setupForegroundMessageListener();
      this.firebaseSupported = true;
      console.log('✅ Firebase Cloud Messaging initialized');
    } catch (error: any) {
      this.firebaseSupported = false;
      if (error?.code === 'messaging/unsupported-browser') {
        console.log('ℹ️ Firebase Cloud Messaging not supported in this browser - using Socket.IO only');
      } else {
        console.log('ℹ️ Firebase Cloud Messaging unavailable - using Socket.IO only:', error?.message);
      }
    }

    console.log('🔔 Notification service initialized. Permission:', this.permission);
    console.log('📱 Mode:', this.firebaseSupported ? 'Socket.IO + FCM' : 'Socket.IO only');
    return this.permission === 'granted';
  }

  // Setup listener for foreground messages
  private static setupForegroundMessageListener() {
    onForegroundMessage((payload) => {
      console.log('📨 Foreground FCM message:', payload);
      
      // Show notification for foreground messages
      if (payload.notification) {
        this.showMessageNotification(
          payload.notification.title || 'New Message',
          payload.notification.body || '',
          payload.data?.chatId || '',
          payload.notification.icon
        );
      }
    });
  }

  // Register FCM token with backend
  static async registerFCMToken(): Promise<boolean> {
    if (!this.firebaseSupported) {
      console.log('ℹ️ FCM not supported - skipping token registration');
      return false;
    }

    try {
      const token = await getFCMToken();
      if (!token) {
        console.log('⚠️ Could not get FCM token');
        return false;
      }

      this.fcmToken = token;

      // Send token to backend
      const authToken = await AuthService.getToken();
      if (!authToken) {
        console.log('⚠️ No auth token available');
        return false;
      }

      const response = await ApiService.registerFCMToken(
        authToken,
        token,
        'Web Browser',
        'web'
      );

      if (response.success) {
        console.log('✅ FCM token registered with backend');
        return true;
      } else {
        console.error('❌ Failed to register FCM token:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      return false;
    }
  }

  // Get current FCM token
  static getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Check if Firebase is supported
  static isFirebaseSupported(): boolean {
    return this.firebaseSupported;
  }

  // Request notification permission from user
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are enabled
  static isEnabled(): boolean {
    return this.permission === 'granted';
  }

  // Show notification for new message
  static showMessageNotification(
    senderName: string,
    messageText: string,
    chatId: string,
    senderPhoto?: string
  ): void {
    if (!this.isEnabled()) {
      console.log('🔕 Notifications not enabled');
      return;
    }

    // Don't show notification if window is focused and user is viewing the chat
    if (document.hasFocus()) {
      const currentPath = window.location.pathname;
      if (currentPath.includes(chatId)) {
        console.log('👀 User is viewing this chat, skipping notification');
        return;
      }
    }

    try {
      // Play notification sound
      this.playNotificationSound();

      // Create notification
      const notification = new Notification(senderName, {
        body: messageText,
        icon: senderPhoto || '/teamly-logo.png',
        badge: '/teamly-badge.png',
        tag: `chat-${chatId}`, // Prevents duplicate notifications
        requireInteraction: false,
        silent: true, // We play our own sound
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        // Navigate to chat (you'll implement this based on your routing)
        window.location.hash = `#chat-${chatId}`;
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('🔔 Notification shown:', senderName);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  // Play notification sound
  private static playNotificationSound(): void {
    if (this.notificationSound) {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch((error) => {
        console.warn('⚠️ Could not play notification sound:', error);
      });
    }
  }

  // Show notification for typing indicator (optional)
  static showTypingNotification(senderName: string, chatId: string): void {
    if (!this.isEnabled() || document.hasFocus()) {
      return;
    }

    // Only show if user is not viewing the chat
    const currentPath = window.location.pathname;
    if (currentPath.includes(chatId)) {
      return;
    }

    try {
      const notification = new Notification(`${senderName} is typing...`, {
        icon: '/teamly-logo.png',
        tag: `typing-${chatId}`,
        requireInteraction: false,
        silent: true,
      });

      // Auto-close after 2 seconds
      setTimeout(() => {
        notification.close();
      }, 2000);
    } catch (error) {
      console.error('❌ Error showing typing notification:', error);
    }
  }

  // Get permission status
  static getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}
