// Hook for handling browser notifications
import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import SocketService from 'teamly_shared/services/socketService';
import { AuthService } from 'teamly_shared';

const NOTIFICATION_PROMPT_SHOWN_KEY = 'teamly_notification_prompt_shown';

export const useNotifications = () => {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from AuthService
    const loadUserId = async () => {
      const userData = await AuthService.getUserData();
      if (userData?.id) {
        setUserId(userData.id.toString());
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Check if we should show permission prompt or register FCM token
    const checkPermission = async () => {
      const permission = NotificationService.getPermissionStatus();
      
      // Check if prompt was already shown this session
      const promptShownThisSession = sessionStorage.getItem(NOTIFICATION_PROMPT_SHOWN_KEY);
      
      if (permission === 'granted') {
        // Permission already granted - just register FCM token silently
        console.log('🔔 Permission already granted, registering FCM token...');
        await NotificationService.registerFCMToken();
        // Don't show prompt if already granted
      } else if (permission === 'default' && !promptShownThisSession) {
        // Only show prompt if permission not decided AND not shown this session
        setTimeout(() => {
          setShowPermissionPrompt(true);
          sessionStorage.setItem(NOTIFICATION_PROMPT_SHOWN_KEY, 'true');
        }, 2000);
      }
      // If permission is 'denied' or prompt already shown, don't show again
    };

    checkPermission();

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      console.log('🔔 New message received:', data);
      
      // Show notification if enabled
      if (NotificationService.isEnabled()) {
        NotificationService.showMessageNotification(
          data.senderName || 'Someone',
          data.text || 'New message',
          data.chatId,
          data.senderPhoto
        );
      }
    };

    // Subscribe to socket events with unique listener ID
    const listenerId = 'notifications';
    SocketService.onNewMessage(handleNewMessage, listenerId);

    // Cleanup
    return () => {
      SocketService.offNewMessage(listenerId);
    };
  }, [userId]);

  const requestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      // Register FCM token for push notifications
      await NotificationService.registerFCMToken();
    }
    setShowPermissionPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPermissionPrompt(false);
  };

  return {
    showPermissionPrompt,
    requestPermission,
    dismissPrompt,
  };
};
