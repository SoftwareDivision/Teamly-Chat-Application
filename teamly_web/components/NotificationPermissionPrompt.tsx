'use client';

import React, { useState, useEffect } from 'react';
import { NotificationService } from '../services/notificationService';
import { Colors } from 'teamly_shared';

interface NotificationPermissionPromptProps {
  onClose: () => void;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Always show the prompt on login
    setIsVisible(true);
  }, []);

  const handleEnable = async () => {
    const permission = NotificationService.getPermissionStatus();
    
    if (permission === 'granted') {
      // Already granted, just register token
      console.log('✅ Notifications already enabled!');
      await NotificationService.registerFCMToken();
    } else if (permission === 'denied') {
      // Show instructions to enable from browser settings
      alert('Notifications are blocked. Please enable them in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Find "Notifications"\n3. Change to "Allow"');
    } else {
      // Request permission
      const granted = await NotificationService.requestPermission();
      if (granted) {
        console.log('✅ Notifications enabled!');
        await NotificationService.registerFCMToken();
      }
    }
    setIsVisible(false);
    onClose();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '32px',
            background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 20px',
          }}
        >
          <span style={{ fontSize: '32px' }}>🔔</span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '600',
            color: Colors.primaryDark,
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          {NotificationService.getPermissionStatus() === 'granted' 
            ? 'Notifications Enabled ✓' 
            : NotificationService.getPermissionStatus() === 'denied'
            ? 'Enable Notifications'
            : 'Enable Notifications'}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            color: '#666',
            textAlign: 'center',
            lineHeight: '22px',
            marginBottom: '28px',
          }}
        >
          {NotificationService.getPermissionStatus() === 'granted'
            ? 'You will receive notifications for new messages. You can disable this anytime from settings.'
            : NotificationService.getPermissionStatus() === 'denied'
            ? 'Notifications are currently blocked. Click "Enable" for instructions to allow notifications in your browser.'
            : 'Get notified when you receive new messages, even when Teamly is in the background.'}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#666',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {NotificationService.getPermissionStatus() === 'granted' 
              ? 'Got It' 
              : NotificationService.getPermissionStatus() === 'denied'
              ? 'Show Instructions'
              : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
};
