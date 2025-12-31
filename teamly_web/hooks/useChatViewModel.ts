// ViewModel hook for Chat Screen (Web) - OPTIMIZED VERSION
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageModel, ChatModel, ApiService, AuthService, socketService } from 'teamly_shared';

export const useChatViewModel = (chatId: string) => {
  const [chat, setChat] = useState<ChatModel | null>(null);
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<MessageModel | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const LIMIT = 50;

  // Memoized handlers to prevent recreating on every render
  const handleNewMessage = useCallback((data: any) => {
    if (data.chatId.toString() === chatId.toString()) {
      console.log('📨 New message received:', data.id);
      
      setMessages((prev) => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some(msg => msg.id === data.id);
        if (exists) {
          console.log('⚠️ Message already exists, skipping:', data.id);
          return prev;
        }
        
        const newMessage: MessageModel = {
          id: data.id,
          text: data.text,
          timestamp: new Date(data.timestamp),
          isSent: data.isSent || false, // Use isSent from socket data
          status: data.status || 'delivered',
          senderName: data.senderName,
          replyTo: data.replyTo,
          documentId: data.documentId,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          thumbnailUrl: data.thumbnailUrl,
          driveLink: data.driveLink,
          driveFileId: data.driveFileId,
        };
        
        // WhatsApp-style: Mark entire chat as read when receiving new message in open chat
        if (!data.isSent) {
          AuthService.getToken().then(token => {
            if (token) {
              ApiService.markChatAsRead(token, chatId).catch(console.error);
            }
          });
        }
        
        return [...prev, newMessage];
      });
    }
  }, [chatId]);

  const handleStatusUpdate = useCallback((data: any) => {
    if (data.chatId.toString() === chatId.toString()) {
      console.log('📬 Status update received:', data.messageId, '→', data.status);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.toString() === data.messageId.toString() 
            ? { ...msg, status: data.status } 
            : msg
        )
      );
    }
  }, [chatId]);

  const handleTypingUpdate = useCallback((data: any) => {
    setIsTyping(data.isTyping);
    if (data.isTyping) {
      setTimeout(() => setIsTyping(false), 3000);
    }
  }, []);

  // Handle message deleted by others (for "delete for everyone")
  const handleMessageDeleted = useCallback((data: any) => {
    if (data.chatId.toString() === chatId.toString()) {
      console.log('🗑️ Message deleted by another user:', data.messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    
    console.log('🔌 Initializing chat:', chatId);
    
    // Immediately clear badge when opening chat (optimistic update)
    socketService.emitClearUnread(chatId);
    console.log('🔔 Immediately cleared badge for chat:', chatId);
    
    // Initialize chat and load messages
    initializeChat();
    
    // Join chat room
    socketService.joinChat(chatId);

    // Setup socket listeners with unique IDs (so they don't conflict with chat list)
    const listenerId = `chat_${chatId}`;
    socketService.onNewMessage(handleNewMessage, listenerId);
    socketService.onMessageStatusUpdate(handleStatusUpdate, listenerId);
    socketService.onUserTyping(handleTypingUpdate, listenerId);
    socketService.onMessageDeleted(handleMessageDeleted, listenerId);

    return () => {
      console.log('🔌 Cleaning up chat:', chatId);
      socketService.leaveChat(chatId);
      // Clean up listeners with specific IDs
      socketService.offNewMessage(listenerId);
      socketService.offMessageStatusUpdate(listenerId);
      socketService.offUserTyping(listenerId);
      socketService.offMessageDeleted(listenerId);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, handleNewMessage, handleStatusUpdate, handleTypingUpdate, handleMessageDeleted]);

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const token = await AuthService.getToken();
      if (!token) return;

      const chatResponse = await ApiService.getChatDetails(token, chatId);
      if (chatResponse.success && chatResponse.chat) {
        setChat({
          id: chatResponse.chat.chatId.toString(),
          type: chatResponse.chat.type,
          title: chatResponse.chat.title || 'Chat',
          avatar: chatResponse.chat.avatar,
          lastMessage: '',
          timestamp: new Date(),
          unreadCount: 0,
        });
      }

      await loadMessages(token);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = useCallback(async (token: string, loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      }
      
      const currentOffset = loadMore ? offset : 0;
      console.log(`📥 Loading messages: offset=${currentOffset}, limit=${LIMIT}`);
      
      const response = await ApiService.getChatMessages(token, chatId, LIMIT, currentOffset);
      
      if (response.success) {
        const loadedMessages: MessageModel[] = response.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          timestamp: new Date(msg.timestamp),
          isSent: msg.isSent,
          senderName: msg.senderName,
          status: msg.status || 'delivered',
          replyTo: msg.replyTo,
          documentId: msg.documentId,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.fileType,
          thumbnailUrl: msg.thumbnailUrl,
        }));
        
        console.log(`✅ Loaded ${loadedMessages.length} messages`);
        
        // Update messages - prepend for load more, replace for initial load
        setMessages(prev => loadMore ? [...loadedMessages, ...prev] : loadedMessages);
        
        // Update pagination state
        setHasMore(loadedMessages.length === LIMIT);
        setOffset(currentOffset + loadedMessages.length);

        // Mark entire chat as read (WhatsApp-style batch update) - only on initial load
        if (!loadMore) {
          const unreadReceivedMessages = loadedMessages.filter(
            msg => !msg.isSent && msg.status !== 'read'
          );
          
          if (unreadReceivedMessages.length > 0) {
            console.log(`📖 Marking chat as read (${unreadReceivedMessages.length} unread messages)`);
            await markChatAsRead(token, chatId);
          }
        }
        
        setError(null);
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, offset, LIMIT]);

  // WhatsApp-style: Mark entire chat as read in one API call
  const markChatAsRead = async (token: string, chatId: string) => {
    try {
      console.log('📖 Calling batch mark-as-read API for chat:', chatId);
      const response = await ApiService.markChatAsRead(token, chatId);
      
      if (response.success) {
        console.log(`✅ Chat marked as read. Marked ${response.markedCount} messages. New unread count: ${response.unreadCount}`);
        
        // Update local message statuses
        setMessages((prev) =>
          prev.map((msg) =>
            !msg.isSent ? { ...msg, status: 'read' } : msg
          )
        );
        
        // Badge will be updated via Socket.IO broadcast from backend
      }
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  };

  const handleSend = async (documentId?: string) => {
    if ((inputText.trim() === '' && !documentId) || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const messageText = inputText.trim();

    const tempMessage: MessageModel = {
      id: tempId,
      text: messageText,
      timestamp: new Date(),
      isSent: true,
      status: 'pending',
      documentId: documentId,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        senderName: replyingTo.isSent ? 'You' : undefined,
      } : undefined,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    setReplyingTo(null);

    try {
      const token = await AuthService.getToken();
      if (!token) return;

      // Send message (sendMessage already handles all fields including documentId)
      const response = await ApiService.sendMessage(
        token, 
        chatId, 
        messageText,
        replyingTo?.id
      );

      if (response.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: response.message.id,
                  status: response.message.status || 'sent',
                  timestamp: new Date(response.message.timestamp),
                  // Update with media fields from response
                  fileUrl: response.message.fileUrl,
                  fileName: response.message.fileName,
                  fileSize: response.message.fileSize,
                  fileType: response.message.fileType,
                  thumbnailUrl: response.message.thumbnailUrl,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReply = (message: MessageModel) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId: string) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      // Use DOM query to find and scroll to the message element
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          console.log('Scrolled to message:', messageId);
        }
      }, 100); // Small delay to ensure DOM is updated
    }
  };

  // Debounced typing indicator
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);

    if (text.length > 0) {
      // Only send typing indicator if not already sent
      if (!typingTimeoutRef.current) {
        socketService.sendTyping(chatId, true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(chatId, false);
        typingTimeoutRef.current = null;
      }, 2000);
    } else {
      // Clear typing immediately when input is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socketService.sendTyping(chatId, false);
    }
  }, [chatId]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    
    try {
      const token = await AuthService.getToken();
      if (!token) return;
      
      await loadMessages(token, true);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [hasMore, isLoadingMore, isLoading, loadMessages]);

  // Scroll handling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 0);
    
    // Load more when scrolled to top
    if (scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, messages.length, loadMoreMessages]);

  const scrollToBottom = useCallback(() => {
    setIsAtBottom(true);
    setShowScrollButton(false);
  }, []);

  const refreshMessages = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;
      await loadMessages(token);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // Delete for me - removes from your view only
  const deleteForMe = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      for (const id of selectedIds) {
        await ApiService.deleteMessage(token, id, 'forMe');
      }
      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
      clearSelection();
    } catch (error) {
      console.error('Delete for me failed:', error);
    }
  };

  // Delete for everyone - removes from all users' views via Socket.IO
  const deleteForEveryone = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      for (const id of selectedIds) {
        await ApiService.deleteMessage(token, id, 'forEveryone');
      }
      // Local removal happens via socket event for consistency
      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
      clearSelection();
    } catch (error) {
      console.error('Delete for everyone failed:', error);
    }
  };

  // Legacy function for backward compatibility
  const deleteSelected = async () => {
    await deleteForMe();
  };

  const copySelected = () => {
    const text = messages
      .filter(m => selectedIds.includes(m.id))
      .map(m => m.text)
      .join('\n');
    
    navigator.clipboard.writeText(text);
    clearSelection();
  };

  return {
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
    refreshMessages,
    toggleSelect,
    clearSelection,
    deleteSelected,
    deleteForMe,
    deleteForEveryone,
    copySelected,
    loadMoreMessages,
    handleScroll,
    scrollToBottom,
  };
};
