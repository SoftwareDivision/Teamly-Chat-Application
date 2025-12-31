'use client';

import { useState, useEffect } from 'react';
import { useMainViewModel } from '../hooks/useMainViewModel';
import { useChatListViewModel } from '../hooks/useChatListViewModel';
import { ApiService, AuthService } from 'teamly_shared';
import ChatListScreen from './ChatListScreen';
import ChatScreen from './ChatScreen';
import ChatInfoScreen from './ChatInfoScreen';
import { IoChatbubbleEllipses, IoPeople, IoCall, IoPerson, IoSearch, IoEllipsisVertical, IoAdd, IoClose } from 'react-icons/io5';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';
import ProfileEditScreen from './ProfileEditScreen';

interface MainScreenProps {
  onLogout: () => void;
}

export default function MainScreen({ onLogout }: MainScreenProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'teams' | 'calls' | 'profile'>('chats');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>('');
  const [activeChatType, setActiveChatType] = useState<'self' | 'private' | 'group'>('self');
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [isChatListCollapsed, setIsChatListCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'contact' | 'group' | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const { userProfile, updateUserProfile, logout } = useMainViewModel(onLogout);
  
  // Get chats to calculate unread count
  const { chats } = useChatListViewModel();
  
  // Calculate total unread messages
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  
  // Notification system
  const { showPermissionPrompt, dismissPrompt } = useNotifications();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsChatListCollapsed(!isChatListCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, isChatListCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChatPress = (chatId: string) => {
    setActiveChatId(chatId);
    if (windowWidth < 768) {
      setIsChatListCollapsed(true);
    }
  };

  const handleBackFromChat = () => {
    setActiveChatId(null);
    // Always reopen the chat list panel when going back
    setIsChatListCollapsed(false);
  };

  const handleAddNewChat = async () => {
    if (newChatType === 'contact' && contactEmail.trim()) {
      try {
        const token = await AuthService.getToken();
        if (!token) {
          alert('Authentication required');
          return;
        }
        
        console.log('🔵 Creating chat with email:', contactEmail);
        
        // Create private chat with contact
        const response = await ApiService.createSingleChatByEmail(token, contactEmail.trim());
        console.log('📥 Create chat response:', response);
        
        if (response?.success) {
          console.log('✅ Chat created successfully, ID:', response.chatId);
          setActiveChatId(response.chatId.toString());
          setActiveChatType('private');
          closeNewChatModal();
          
          // Refresh chat list to show the new chat
          window.location.reload();
        } else {
          alert(response?.message || 'Failed to create chat');
        }
      } catch (error: any) {
        console.error('❌ Error creating chat:', error);
        alert(error.message || 'Failed to create chat');
      }
    } else if (newChatType === 'group' && groupName.trim()) {
      alert('Group creation coming soon!');
      // TODO: Implement group creation
    }
  };

  const closeNewChatModal = () => {
    setShowNewChatModal(false);
    setNewChatType(null);
    setContactEmail('');
    setGroupName('');
  };

  const railItems = [
    { id: 'chats', icon: <IoChatbubbleEllipses size={24} />, label: 'Chat', badge: totalUnreadCount },
    { id: 'teams', icon: <IoPeople size={24} />, label: 'Teams', badge: 0 },
    { id: 'calls', icon: <IoCall size={24} />, label: 'Calls', badge: 0 },
    { id: 'profile', icon: <IoPerson size={24} />, label: 'Profile', badge: 0 },
  ];

  const chatListWidth = isChatListCollapsed ? '0px' : windowWidth < 768 ? '100%' : windowWidth < 1024 ? '280px' : '360px';
  const showChatList = !isChatListCollapsed || windowWidth >= 768;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#F5F5F5',
    }}>
      {/* Left Rail Navigation */}
      <div style={{
        width: '64px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
        display: windowWidth < 768 ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '8px',
        paddingBottom: '8px',
        flexShrink: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: '#E91E63',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(233, 30, 99, 0.3)',
        }}>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>T</span>
        </div>

        {/* Navigation Items */}
        {railItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as any);
              // Reopen chat list panel when clicking Chat tab
              if (item.id === 'chats' && isChatListCollapsed) {
                setIsChatListCollapsed(false);
              }
            }}
            title={item.label}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === item.id ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = '#F5F5F5';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {activeTab === item.id && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '32px',
                backgroundColor: '#E91E63',
                borderRadius: '0 2px 2px 0',
              }} />
            )}
            <div style={{
              color: activeTab === item.id ? '#E91E63' : '#757575',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {item.icon}
            </div>
            <span style={{
              fontSize: '10px',
              color: activeTab === item.id ? '#E91E63' : '#757575',
              fontWeight: activeTab === item.id ? '600' : '400',
              marginTop: '2px',
            }}>
              {item.label}
            </span>
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Profile at bottom */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#E91E63',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginTop: '8px',
          border: '2px solid #FFFFFF',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          {userProfile.photo ? (
            <img
              src={userProfile.photo}
              alt={userProfile.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {userProfile.name[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
      </div>

      {/* Chat List Panel */}
      <div style={{
        width: chatListWidth,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
        display: showChatList ? 'flex' : 'none',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        zIndex: 50,
      }}>
        {/* Chat List Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: showSearch ? '12px' : '0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {windowWidth >= 768 && (
                <button
                  onClick={() => setIsChatListCollapsed(true)}
                  title="Close panel (Ctrl+B)"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#616161',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                    e.currentTarget.style.color = '#E91E63';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#616161';
                  }}
                >
                  ✕
                </button>
              )}
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#212121',
              }}>
                {activeTab === 'chats' ? 'Chat' : activeTab === 'teams' ? 'Teams' : activeTab === 'calls' ? 'Calls' : 'Profile'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) {
                    // Clear search when closing
                    setSearchQuery('');
                  }
                }}
                title={showSearch ? "Close search" : "Search (Ctrl+K)"}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: showSearch ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: showSearch ? '#E91E63' : '#616161',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!showSearch) {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(233, 30, 99, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showSearch) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(233, 30, 99, 0.1)';
                  }
                }}
              >
                {showSearch ? <IoClose size={18} /> : <IoSearch size={18} />}
              </button>
              <button 
                title="More options"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#616161',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <IoEllipsisVertical size={18} />
              </button>
              <button 
                onClick={() => setShowNewChatModal(true)}
                title="New chat"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#E91E63',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#FFFFFF',
                  fontWeight: '300',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(233, 30, 99, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C2185B';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(233, 30, 99, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E91E63';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(233, 30, 99, 0.2)';
                }}
              >
                <IoAdd size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div style={{
              position: 'relative',
              animation: 'slideDown 0.2s ease-out',
            }}>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#F5F5F5',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#E91E63';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#9E9E9E',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                    e.currentTarget.style.color = '#616161';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9E9E9E';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat List Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'chats' && (
            <ChatListScreen
              onChatPress={handleChatPress}
              userAvatar={userProfile.photo}
              searchQuery={searchQuery}
            />
          )}
          {activeTab === 'teams' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#616161', fontSize: '16px' }}>No teams yet</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#9E9E9E' }}>Create a team to collaborate</p>
              </div>
            </div>
          )}
          {activeTab === 'calls' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#616161', fontSize: '16px' }}>No calls yet</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#9E9E9E' }}>Your call history appears here</p>
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <ProfileEditScreen
              userProfile={userProfile}
              onProfileUpdate={updateUserProfile}
              onLogout={logout}
            />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        position: 'relative',
        paddingBottom: windowWidth < 768 && !activeChatId ? '64px' : '0',
      }}>
        {showChatInfo && activeChatId ? (
          <ChatInfoScreen
            chatName={activeChatName}
            chatType={activeChatType}
            chatId={activeChatId}
            onBack={() => setShowChatInfo(false)}
          />
        ) : activeChatId ? (
          <>
            {/* Toggle Chat List Button (when collapsed) */}
            {isChatListCollapsed && windowWidth >= 768 && (
              <button
                onClick={() => setIsChatListCollapsed(false)}
                title="Show chat list"
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#E91E63',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#FFFFFF',
                  zIndex: 10,
                  boxShadow: '0 2px 12px rgba(233, 30, 99, 0.4)',
                  transition: 'all 0.2s',
                  fontWeight: '400',
                  lineHeight: '1',
                  padding: '0',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C2185B';
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(233, 30, 99, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E91E63';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(233, 30, 99, 0.4)';
                }}
              >
                ←
              </button>
            )}
            <ChatScreen
              chatId={activeChatId}
              onBack={handleBackFromChat}
              onHeaderPress={(chatName, chatType) => {
                setActiveChatName(chatName);
                setActiveChatType(chatType);
                setShowChatInfo(true);
              }}
            />
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '20px',
          }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '24px',
                animation: 'fadeIn 0.5s ease-in',
              }}>💬</div>
              <h2 style={{
                margin: '0 0 12px 0',
                color: '#616161',
                fontSize: '24px',
                fontWeight: '600',
              }}>Teamly Web</h2>
              <p style={{
                margin: 0,
                fontSize: '15px',
                color: '#9E9E9E',
                lineHeight: '1.5',
              }}>
                Select a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal - Exact Mobile UI */}
      {showNewChatModal && (
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
            width: '85%',
            maxWidth: '500px',
            animation: 'slideUp 0.3s ease-out',
            overflow: 'hidden',
          }}>
            {/* Header - Pink Background (Mobile Style) */}
            <div style={{
              backgroundColor: '#E91E63',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}>
                {newChatType ? (newChatType === 'contact' ? 'New Chat' : 'New Group') : 'New Chat'}
              </h3>
              <button
                onClick={closeNewChatModal}
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
                <IoClose size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px' }}>
              {!newChatType ? (
                // Chat Type Selection - Mobile Style Menu
                <div>
                  <button
                    onClick={() => setNewChatType('contact')}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      border: 'none',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#333333',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F5F5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    New Contact
                  </button>
                  <div style={{
                    height: '1px',
                    backgroundColor: '#F0F0F0',
                  }} />
                  <button
                    onClick={() => setNewChatType('group')}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      border: 'none',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#333333',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F5F5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    New Group
                  </button>
                </div>
              ) : newChatType === 'contact' ? (
                // Add Contact Form - Mobile Style
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    color: '#333333',
                    marginBottom: '12px',
                    fontWeight: '500',
                  }}>
                    Enter contact's email:
                  </label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #DDDDDD',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '20px',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#E91E63';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#DDDDDD';
                    }}
                  />
                  <button
                    onClick={handleAddNewChat}
                    disabled={!contactEmail.trim()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: contactEmail.trim() ? '#E91E63' : '#CCCCCC',
                      cursor: contactEmail.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (contactEmail.trim()) {
                        e.currentTarget.style.backgroundColor = '#C2185B';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (contactEmail.trim()) {
                        e.currentTarget.style.backgroundColor = '#E91E63';
                      }
                    }}
                  >
                    Start Chat
                  </button>
                </div>
              ) : (
                // Create Group Form - Mobile Style
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    color: '#333333',
                    marginBottom: '12px',
                    fontWeight: '500',
                  }}>
                    Group name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #DDDDDD',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '20px',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#E91E63';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#DDDDDD';
                    }}
                  />
                  <button
                    onClick={handleAddNewChat}
                    disabled={!groupName.trim()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: groupName.trim() ? '#E91E63' : '#CCCCCC',
                      cursor: groupName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (groupName.trim()) {
                        e.currentTarget.style.backgroundColor = '#C2185B';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (groupName.trim()) {
                        e.currentTarget.style.backgroundColor = '#E91E63';
                      }
                    }}
                  >
                    Create Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (< 768px only) - Hide when chat is open */}
      {windowWidth < 768 && !activeChatId && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E0E0E0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }}>
          {railItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                // Reopen chat list panel when clicking Chat tab
                if (item.id === 'chats' && isChatListCollapsed) {
                  setIsChatListCollapsed(false);
                }
                // Close chat when switching tabs on mobile
                if (activeChatId && item.id !== 'chats') {
                  setActiveChatId(null);
                  setIsChatListCollapsed(false);
                }
              }}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                position: 'relative',
                padding: '8px',
              }}
            >
              {activeTab === item.id && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '3px',
                  backgroundColor: '#E91E63',
                  borderRadius: '0 0 2px 2px',
                }} />
              )}
              <div style={{
                color: activeTab === item.id ? '#E91E63' : '#757575',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <span style={{
                fontSize: '11px',
                color: activeTab === item.id ? '#E91E63' : '#757575',
                fontWeight: activeTab === item.id ? '600' : '400',
              }}>
                {item.label}
              </span>
              {item.badge > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '50%',
                  transform: 'translateX(12px)',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  backgroundColor: '#E91E63',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  padding: '0 4px',
                }}>
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showPermissionPrompt && (
        <NotificationPermissionPrompt onClose={dismissPrompt} />
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Custom Scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(233, 30, 99, 0.3) transparent;
        }

        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background-color: rgba(233, 30, 99, 0.3);
          border-radius: 3px;
          transition: background-color 0.2s;
        }

        *::-webkit-scrollbar-thumb:hover {
          background-color: rgba(233, 30, 99, 0.5);
        }

        /* Focus visible for accessibility */
        *:focus-visible {
          outline: 2px solid #E91E63;
          outline-offset: 2px;
        }

        /* Smooth transitions */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Mobile touch improvements */
        @media (max-width: 767px) {
          * {
            -webkit-tap-highlight-color: rgba(233, 30, 99, 0.1);
          }
          
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Responsive breakpoints */
        @media (max-width: 1023px) {
          /* Tablet optimizations */
        }

        @media (max-width: 767px) {
          /* Mobile optimizations */
          body {
            font-size: 14px;
          }
        }

        /* Print styles */
        @media print {
          * {
            background: white !important;
            color: black !important;
          }
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          * {
            border-width: 2px !important;
          }
        }
      `}</style>
    </div>
  );
}
