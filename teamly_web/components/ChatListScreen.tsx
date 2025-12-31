'use client';

import { useState } from 'react';
import { useChatListViewModel } from '../hooks/useChatListViewModel';
import { ChatModel } from 'teamly_shared';
import ChatContextMenu from './ChatContextMenu';

interface ChatListScreenProps {
  onChatPress: (chatId: string, chatType: 'self' | 'private' | 'group') => void;
  userAvatar?: string;
  searchQuery?: string;
}

export default function ChatListScreen({ onChatPress, userAvatar, searchQuery = '' }: ChatListScreenProps) {
  const { chats, isLoading, refreshChats, deleteChat } = useChatListViewModel();
  
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    chat: ChatModel | null;
    position: { x: number; y: number };
  }>({ visible: false, chat: null, position: { x: 0, y: 0 } });

  const handleContextMenu = (e: React.MouseEvent, chat: ChatModel) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      chat,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleDeleteChat = async () => {
    if (!contextMenu.chat) return;
    
    if (confirm(`Are you sure you want to delete "${contextMenu.chat.title}"? This cannot be undone.`)) {
      const success = await deleteChat(contextMenu.chat.id);
      if (success) {
        alert('Chat deleted successfully');
      } else {
        alert('Failed to delete chat. Please try again.');
      }
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '60px' }}>
        <p>Loading chats...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '60px',
          backgroundColor: 'rgba(233, 30, 99, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          animation: 'fadeIn 0.5s ease-in',
        }}>
          <span style={{ fontSize: '56px' }}>💬</span>
        </div>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '600',
          color: '#212121',
          marginBottom: '12px',
          margin: 0,
        }}>
          No conversations yet
        </h2>
        <p style={{
          fontSize: '15px',
          color: '#757575',
          lineHeight: '22px',
          marginBottom: '24px',
          maxWidth: '280px',
        }}>
          Start chatting with your team by clicking the + button above
        </p>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#F5F5F5',
            borderRadius: '20px',
            fontSize: '13px',
            color: '#616161',
          }}>
            💡 Tip: Use Ctrl+K to search
          </div>
        </div>
      </div>
    );
  }

  // Show no results message when searching
  if (searchQuery && filteredChats.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <p style={{ fontSize: '15px', color: '#757575', margin: 0 }}>
          No chats found for "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', backgroundColor: '#fff' }} className="custom-scrollbar">
      {filteredChats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatPress(chat.id, chat.type)}
          onContextMenu={(e) => handleContextMenu(e, chat)}
          style={{
            display: 'flex',
            padding: '12px 16px',
            borderBottom: '1px solid #E9EDEF',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F6F6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ marginRight: '12px', flexShrink: 0 }}>
            {chat.avatar ? (
              <img
                src={chat.avatar}
                alt={chat.title}
                onError={(e) => {
                  // Hide broken image and show fallback
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '25px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : null}
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '25px',
              backgroundColor: '#E91E63',
              display: chat.avatar ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
            }}>
              {chat.title[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '16.5px', 
                fontWeight: '500', 
                color: '#111B21',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                marginRight: '8px',
              }}>
                {chat.title}
              </h3>
              <span style={{ 
                fontSize: '12px', 
                color: '#667781',
                flexShrink: 0,
              }}>
                {formatTime(chat.timestamp)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#667781',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                lineHeight: '1.4',
              }}>
                {chat.lastMessage || 'No messages yet'}
              </p>
              {chat.unreadCount > 0 && (
                <div style={{
                  backgroundColor: '#25D366',
                  borderRadius: '12px',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  marginLeft: '8px',
                  flexShrink: 0,
                }}>
                  <span style={{ 
                    color: '#fff', 
                    fontSize: '11px', 
                    fontWeight: '600',
                  }}>
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <ChatContextMenu
        visible={contextMenu.visible}
        chatName={contextMenu.chat?.title || ''}
        position={contextMenu.position}
        onClose={() => setContextMenu({ visible: false, chat: null, position: { x: 0, y: 0 } })}
        onDelete={handleDeleteChat}
      />
    </div>
  );
}
