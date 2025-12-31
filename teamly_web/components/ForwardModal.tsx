'use client';

import { useState, useEffect } from 'react';
import { ChatModel, ApiService, AuthService } from 'teamly_shared';

interface ForwardModalProps {
  visible: boolean;
  onClose: () => void;
  onForward: (chatIds: string[]) => void;
  messageCount: number;
}

export default function ForwardModal({ visible, onClose, onForward, messageCount }: ForwardModalProps) {
  const [chats, setChats] = useState<ChatModel[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadChats();
    } else {
      setSelectedChats([]);
      setSearchQuery('');
    }
  }, [visible]);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const token = await AuthService.getToken();
      if (!token) return;
      
      const response = await ApiService.getAllChats(token);
      if (response.success && response.chats) {
        const loadedChats: ChatModel[] = response.chats.map((chat: any) => ({
          id: chat.chatId.toString(),
          type: chat.type,
          title: chat.name || chat.title || 'Chat',
          avatar: chat.avatar,
          lastMessage: chat.lastMessage || '',
          timestamp: chat.lastMessageTime ? new Date(chat.lastMessageTime) : new Date(),
          unreadCount: chat.unreadCount || 0,
        }));
        setChats(loadedChats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length > 0) {
      onForward(selectedChats);
      onClose();
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#00A884',
          padding: '16px 20px',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
            }}>
              Forward {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </h3>
            {selectedChats.length > 0 && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                {selectedChats.length} chat{selectedChats.length === 1 ? '' : 's'} selected
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#FFFFFF',
              transition: 'all 0.2s',
              padding: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E9EDEF' }}>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              backgroundColor: '#F0F2F5',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00A884';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E0E0E0';
              e.currentTarget.style.backgroundColor = '#F0F2F5';
            }}
          />
        </div>

        {/* Chat List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#8696A0' }}>Loading chats...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#8696A0' }}>No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedChats.includes(chat.id);
              return (
                <div
                  key={chat.id}
                  onClick={() => toggleChat(chat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(0, 168, 132, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F5F6F6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: isSelected ? 'none' : '2px solid #8696A0',
                    backgroundColor: isSelected ? '#00A884' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    transition: 'all 0.2s',
                  }}>
                    {isSelected && (
                      <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#00A884',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginRight: '12px',
                    flexShrink: 0,
                  }}>
                    {chat.title[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Chat Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#111B21',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {chat.title}
                    </h4>
                    {chat.lastMessage && (
                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '13px',
                        color: '#667781',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #E9EDEF',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: 'transparent',
              color: '#00A884',
              border: '1px solid #00A884',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 168, 132, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0}
            style={{
              padding: '10px 24px',
              backgroundColor: selectedChats.length > 0 ? '#00A884' : '#CCCCCC',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: selectedChats.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedChats.length > 0) {
                e.currentTarget.style.backgroundColor = '#008F6D';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedChats.length > 0) {
                e.currentTarget.style.backgroundColor = '#00A884';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Forward
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
