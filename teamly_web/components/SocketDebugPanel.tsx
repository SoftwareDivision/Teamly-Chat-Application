'use client';

import { useState, useEffect } from 'react';
import { socketService } from 'teamly_shared';

/**
 * Socket.IO Debug Panel for Web
 * Add this component to your MainScreen to monitor socket connection
 */
export default function SocketDebugPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check connection status every second
    const interval = setInterval(() => {
      const connected = socketService.isConnected();
      setIsConnected(connected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addEvent = (event: string) => {
    setEvents(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  useEffect(() => {
    // Monitor all socket events
    const handleConnect = () => addEvent('✅ Connected');
    const handleDisconnect = () => addEvent('❌ Disconnected');
    const handleNewMessage = (data: any) => addEvent(`📨 New message in chat ${data.chatId}`);
    const handleStatusUpdate = (data: any) => addEvent(`📊 Status update: ${data.status}`);
    const handleTyping = (data: any) => addEvent(`⌨️ User typing: ${data.isTyping}`);
    const handleChatListUpdate = (data: any) => addEvent(`📋 Chat list updated: ${data.chatId}`);

    // Note: We can't directly access socket.on from the service, 
    // so we'll just show connection status
    addEvent('🔍 Debug panel initialized');

    return () => {
      // Cleanup if needed
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#4CAF50' : '#F44336',
          border: 'none',
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
        }}
        title={isConnected ? 'Socket Connected' : 'Socket Disconnected'}
      >
        🔌
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      maxHeight: '400px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: isConnected ? '#4CAF50' : '#F44336',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔌</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Socket.IO Debug</div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E0E0E0',
        backgroundColor: '#F5F5F5',
      }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Connection Status</div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '500',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4CAF50' : '#F44336',
            animation: isConnected ? 'pulse 2s infinite' : 'none',
          }} />
          {isConnected ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Events Log */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: 'monospace',
        backgroundColor: '#FAFAFA',
      }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
          Recent Events:
        </div>
        {events.length === 0 ? (
          <div style={{ color: '#999', fontSize: '11px' }}>No events yet...</div>
        ) : (
          events.map((event, index) => (
            <div key={index} style={{
              padding: '4px 0',
              borderBottom: '1px solid #E0E0E0',
              color: '#333',
              fontSize: '11px',
            }}>
              {event}
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #E0E0E0',
        display: 'flex',
        gap: '8px',
      }}>
        <button
          onClick={() => {
            console.log('🔌 Socket connected:', socketService.isConnected());
            addEvent('🔍 Connection check logged to console');
          }}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Check Console
        </button>
        <button
          onClick={() => {
            setEvents([]);
            addEvent('🗑️ Events cleared');
          }}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#FF9800',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Clear Log
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
