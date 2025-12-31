'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatViewModel } from '../hooks/useChatViewModel';
import MessageBubble from './MessageBubble';
import ReplyPreviewBar from './ReplyPreviewBar';
import ForwardModal from './ForwardModal';
import DeleteMessageModal from './DeleteMessageModal';
import DriveFileUploadButton from './DriveFileUploadButton';
import TypingIndicator from './TypingIndicator';
import { AuthService, ApiService } from 'teamly_shared';
import { IoArrowBack, IoSearch, IoEllipsisVertical, IoClose, IoArrowUndo, IoSend, IoStar, IoTrash, IoCopy, IoArrowForward } from 'react-icons/io5';

interface ChatScreenProps {
  chatId: string;
  onBack: () => void;
  onHeaderPress?: (chatName: string, chatType: 'self' | 'private' | 'group') => void;
}

export default function ChatScreen({ chatId, onBack, onHeaderPress }: ChatScreenProps) {
  const [token, setToken] = useState<string>('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    AuthService.getToken().then(t => setToken(t || ''));
  }, []);

  // Window resize listener for responsive design
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    chat,
    messages,
    inputText,
    isLoading,
    isLoadingMore,
    isTyping,
    selectedIds,
    replyingTo,
    isAtBottom,
    showScrollButton,
    hasMore,
    error,
    formatTimestamp,
    handleSend,
    handleInputChange,
    handleReply,
    cancelReply,
    scrollToMessage,
    toggleSelect,
    clearSelection,
    deleteForMe,
    deleteForEveryone,
    copySelected,
    loadMoreMessages,
    handleScroll,
    scrollToBottom,
  } = useChatViewModel(chatId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectionMode = selectedIds.length > 0;
  const isMobile = windowWidth < 768;
  
  // WhatsApp logic: Can only "Delete for everyone" if ALL selected messages are sent by current user
  const canDeleteForEveryone = selectedIds.length > 0 && 
    selectedIds.every(id => {
      const msg = messages.find(m => m.id === id);
      return msg?.isSent === true; // Only messages I sent
    });

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = messages
        .filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(msg => msg.id);
      setSearchResults(results);
      setCurrentSearchIndex(0);
      // Auto-scroll to first result
      if (results.length > 0) {
        scrollToMessage(results[0]);
      }
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchQuery, messages]);

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex]);
  };

  // Auto-scroll to bottom on initial load (like WhatsApp)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      // Scroll to bottom immediately on first load
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading]); // Only run when loading completes

  // Auto-scroll only when at bottom (for new messages)
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  if (isLoading && !chat) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Header - Fixed on mobile, relative on desktop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '6px 10px' : '12px 20px',
        backgroundColor: '#E91E63',
        color: '#fff',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        zIndex: isMobile ? 100 : 'auto',
        minHeight: isMobile ? '52px' : 'auto',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '6px',
            marginRight: '12px',
            borderRadius: '4px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <IoArrowBack size={22} />
        </button>
        
        {/* Chat Avatar */}
        <div style={{
          width: isMobile ? '30px' : '36px',
          height: isMobile ? '30px' : '36px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: isMobile ? '8px' : '10px',
          fontSize: isMobile ? '13px' : '16px',
          fontWeight: '600',
        }}>
          {chat?.title?.[0]?.toUpperCase() || 'C'}
        </div>

        <div 
          style={{ flex: 1, cursor: 'pointer' }}
          onClick={() => onHeaderPress && onHeaderPress(chat?.title || 'Chat', chat?.type || 'private')}
        >
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
          }}>
            {chat?.title || 'Chat'}
          </h2>
          {isTyping && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px',
            }}>
              <span style={{ 
                fontSize: '11px', 
                opacity: 0.9,
                fontWeight: '400',
              }}>
                typing
              </span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                <div className="typing-dot" style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  animation: 'typingDot 1.4s infinite',
                  animationDelay: '0s',
                }} />
                <div className="typing-dot" style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  animation: 'typingDot 1.4s infinite',
                  animationDelay: '0.2s',
                }} />
                <div className="typing-dot" style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  animation: 'typingDot 1.4s infinite',
                  animationDelay: '0.4s',
                }} />
              </div>
            </div>
          )}
        </div>

        {selectionMode ? (
          <>
            <button
              onClick={clearSelection}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '6px',
                marginRight: isMobile ? '4px' : '8px',
                borderRadius: '4px',
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ✕
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: '400',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {selectedIds.length} selected
              </h2>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '2px' : '4px' }}>
              {/* Mobile: Show only Delete + Menu. Desktop: Show all buttons */}
              {!isMobile && (
                <button
                  title="Star messages"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '4px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <IoStar size={20} />
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Delete messages"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: isMobile ? '18px' : '20px',
                  cursor: 'pointer',
                  padding: isMobile ? '4px' : '6px',
                  borderRadius: '4px',
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <IoTrash size={isMobile ? 18 : 20} />
              </button>
              {!isMobile && selectedIds.length === 1 && (
                <button
                  onClick={() => {
                    const selectedMessage = messages.find(m => m.id === selectedIds[0]);
                    if (selectedMessage) {
                      handleReply(selectedMessage);
                      clearSelection();
                    }
                  }}
                  title="Reply to message"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '4px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <IoArrowUndo size={20} />
                </button>
              )}
              {!isMobile && (
                <>
                  <button
                    onClick={() => setShowForwardModal(true)}
                    title="Forward messages"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <IoArrowForward size={20} />
                  </button>
                  <button
                    onClick={copySelected}
                    title="Copy messages"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <IoCopy size={20} />
                  </button>
                </>
              )}
              {/* Mobile: Show menu button for more options */}
              {isMobile && (
                <button
                  title="More options"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <IoEllipsisVertical size={18} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => setShowSearch(!showSearch)}
              title="Search in chat"
              style={{
                background: showSearch ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = showSearch ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}
            >
              <IoSearch size={20} />
            </button>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <IoEllipsisVertical size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Search Bar - Fixed on mobile */}
      {showSearch && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '6px 12px' : '8px 16px',
          backgroundColor: '#F0F0F0',
          borderBottom: '1px solid #D1D7DB',
          gap: '8px',
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? '52px' : 'auto',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          zIndex: isMobile ? 99 : 'auto',
        }}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #D1D7DB',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#FFFFFF',
            }}
          />
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#667781', whiteSpace: 'nowrap' }}>
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <button
                onClick={() => navigateSearch('prev')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '16px',
                  color: '#00A884',
                }}
              >
                ↑
              </button>
              <button
                onClick={() => navigateSearch('next')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '16px',
                  color: '#00A884',
                }}
              >
                ↓
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '18px',
              color: '#667781',
            }}
          >
            <IoClose size={20} />
          </button>
        </div>
      )}

      {/* Messages - Scrollable */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: isMobile ? '#E5DDD5' : '#EFEAE2',
          backgroundImage: isMobile ? 'none' : 'linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px)',
          backgroundSize: isMobile ? 'auto' : '100% 20px',
          padding: isMobile ? '8px 0' : '12px 0',
          paddingTop: isMobile ? (showSearch ? '96px' : '52px') : '12px',
          paddingBottom: isMobile ? (replyingTo ? '104px' : '60px') : '12px',
          minHeight: 0,
          position: 'relative',
        }}
        className="custom-scrollbar"
      >
        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            padding: '12px 20px',
            margin: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && messages.length > 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoadingMore ? '#CCCCCC' : '#E91E63',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isLoadingMore ? 'Loading...' : 'Load Previous Messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading ? (
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
              width: '80px',
              height: '80px',
              borderRadius: '40px',
              backgroundColor: 'rgba(233, 30, 99, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '36px' }}>👋</span>
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#212121',
              marginBottom: '8px',
              margin: 0,
            }}>
              Start the conversation
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#757575',
              lineHeight: '20px',
              maxWidth: '240px',
            }}>
              Send a message to begin chatting
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                formatTimestamp={formatTimestamp}
                isSelected={selectedIds.includes(message.id)}
                selectionMode={selectionMode}
                onLongPress={() => toggleSelect(message.id)}
                onClick={() => selectionMode && toggleSelect(message.id)}
                onReply={() => handleReply(message)}
                onReplyPress={() => message.replyTo && scrollToMessage(message.replyTo.id)}
                isHighlighted={searchResults.length > 0 && message.id === searchResults[currentSearchIndex]}
              />
            ))}
            {isTyping && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                padding: '2px 20px',
                marginBottom: '2px',
              }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                  padding: '8px 12px',
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && !selectionMode && (
        <div style={{
          position: isMobile ? 'fixed' : 'relative',
          bottom: isMobile ? '52px' : 'auto',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          zIndex: isMobile ? 99 : 'auto',
        }}>
          <ReplyPreviewBar
            senderName={replyingTo.isSent ? 'You' : (replyingTo.senderName || 'User')}
            messageText={replyingTo.text}
            onCancel={cancelReply}
          />
        </div>
      )}

      {/* Input Box - Fixed on mobile, relative on desktop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '6px 10px' : '12px 16px',
        paddingBottom: isMobile ? 'max(6px, env(safe-area-inset-bottom))' : '12px',
        backgroundColor: '#F0F0F0',
        borderTop: '1px solid #D1D7DB',
        flexShrink: 0,
        gap: isMobile ? '6px' : '8px',
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        zIndex: isMobile ? 100 : 'auto',
        minHeight: isMobile ? '52px' : 'auto',
      }}>
        {/* Input Container with Attachment Icon Inside */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '6px 12px' : '8px 16px',
          gap: isMobile ? '6px' : '8px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}>
          <DriveFileUploadButton
            onUploadSuccess={async (fileData) => {
              console.log('📤 Sending message with Drive link:', fileData);
              
              // Send message with Drive link
              const token = await AuthService.getToken();
              if (!token) return;

              try {
                // Get view link instead of download link for better preview
                const viewLink = `https://drive.google.com/file/d/${fileData.driveFileId}/view`;
                
                // Send message with Drive link using ApiService
                const response = await ApiService.sendMessage(
                  token,
                  chatId,
                  `${fileData.fileName}\n${viewLink}`,
                  undefined,
                  {
                    driveLink: fileData.driveLink,
                    driveFileId: fileData.driveFileId,
                    fileName: fileData.fileName,
                    fileType: fileData.fileType,
                    fileSize: fileData.fileSize,
                  }
                );

                if (response.success) {
                  console.log('✅ Message sent with Drive link');
                  // Message will appear instantly via Socket.IO 'new_message' event
                } else {
                  throw new Error(response.message || 'Failed to send message');
                }
              } catch (error) {
                console.error('Failed to send message:', error);
                alert('Failed to send file. Please try again.');
              }
            }}
            onUploadError={(error) => {
              console.error('Upload failed:', error);
              alert('Failed to upload file: ' + error);
            }}
          />
          <textarea
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              padding: isMobile ? '2px 0' : '4px 0',
              fontSize: isMobile ? '15px' : '15px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              resize: 'none',
              maxHeight: isMobile ? '80px' : '120px',
              minHeight: isMobile ? '20px' : '24px',
              outline: 'none',
              lineHeight: '1.5',
              color: '#111',
            }}
            rows={1}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          style={{
            width: isMobile ? '36px' : '48px',
            height: isMobile ? '36px' : '48px',
            borderRadius: '50%',
            backgroundColor: inputText.trim() ? '#E91E63' : '#B0B0B0',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: inputText.trim() ? '0 2px 8px rgba(233, 30, 99, 0.3)' : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (inputText.trim()) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <IoSend size={isMobile ? 15 : 18} />
        </button>
      </div>

      {/* Forward Modal */}
      <ForwardModal
        visible={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={async (chatIds) => {
          try {
            const selectedMessages = messages.filter(m => selectedIds.includes(m.id));
            
            for (const targetChatId of chatIds) {
              for (const msg of selectedMessages) {
                // Forward message text (files would need separate handling)
                await ApiService.sendMessage(token, targetChatId, msg.text || '(Forwarded message)');
              }
            }
            
            alert(`Forwarded ${selectedMessages.length} message(s) to ${chatIds.length} chat(s)`);
            clearSelection();
            setShowForwardModal(false);
          } catch (error) {
            console.error('Forward failed:', error);
            alert('Failed to forward messages');
          }
        }}
        messageCount={selectedIds.length}
      />

      {/* Delete Message Modal - WhatsApp Style */}
      <DeleteMessageModal
        visible={showDeleteModal}
        messageCount={selectedIds.length}
        canDeleteForEveryone={canDeleteForEveryone}
        onClose={() => setShowDeleteModal(false)}
        onDeleteForMe={() => {
          deleteForMe();
          setShowDeleteModal(false);
        }}
        onDeleteForEveryone={() => {
          deleteForEveryone();
          setShowDeleteModal(false);
        }}
      />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
