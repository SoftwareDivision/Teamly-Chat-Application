'use client';

import { useState } from 'react';
import { ApiService, AuthService } from 'teamly_shared';

interface ConnectDriveModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export default function ConnectDriveModal({ visible, onClose, onConnected }: ConnectDriveModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('🚀 Starting Google Drive connection...');
      
      const token = await AuthService.getToken();
      if (!token) {
        alert('Please login first');
        setIsConnecting(false);
        return;
      }

      // Get Google OAuth URL
      const response = await ApiService.getGoogleDriveAuthUrl(token);
      
      if (response.success && response.authUrl) {
        console.log('✅ Got OAuth URL, opening popup...');
        
        // Open OAuth popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          response.authUrl,
          'Google Drive Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Process auth code
        const processAuthCode = async (code: string) => {
          console.log('📨 Received auth code, sending to backend...');
          
          try {
            const callbackResponse = await ApiService.handleGoogleDriveCallback(token, code);
            
            if (callbackResponse.success) {
              console.log('✅ Google Drive connected!');
              onConnected();
              onClose();
            } else {
              alert('Failed to connect: ' + (callbackResponse.message || 'Unknown error'));
            }
          } catch (error) {
            console.error('❌ Callback error:', error);
            alert('Failed to connect Google Drive');
          }
          
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('storage', handleStorage);
          popup?.close();
          setIsConnecting(false);
        };

        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data.type === 'GOOGLE_DRIVE_AUTH_SUCCESS') {
            await processAuthCode(event.data.code);
          }
        };

        const handleStorage = async (event: StorageEvent) => {
          if (event.key === 'google_drive_auth_status' && event.newValue === 'success') {
            const code = localStorage.getItem('google_drive_auth_code');
            if (code) {
              localStorage.removeItem('google_drive_auth_code');
              localStorage.removeItem('google_drive_auth_status');
              await processAuthCode(code);
            }
          }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorage);
      } else {
        alert('Failed to get authorization URL');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Connect Drive error:', error);
      alert('Failed to connect Google Drive');
      setIsConnecting(false);
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        width: '85%',
        maxWidth: '320px',
        overflow: 'hidden',
      }}>
        {/* Content */}
        <div style={{
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
          }}>
            Connect Google Drive
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.5',
          }}>
            Share files easily in your chats
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '0 16px 16px 16px',
        }}>
          <button
            onClick={onClose}
            disabled={isConnecting}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f5f5f5',
              fontSize: '15px',
              fontWeight: '600',
              color: '#666',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => !isConnecting && (e.currentTarget.style.backgroundColor = '#e0e0e0')}
            onMouseLeave={(e) => !isConnecting && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isConnecting ? '#ccc' : '#E91E63',
              fontSize: '15px',
              fontWeight: '600',
              color: '#fff',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => !isConnecting && (e.currentTarget.style.backgroundColor = '#C2185B')}
            onMouseLeave={(e) => !isConnecting && (e.currentTarget.style.backgroundColor = '#E91E63')}
          >
            {isConnecting ? (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
