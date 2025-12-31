// Universal ViewModel for Chat Screen (handles self, 1-to-1, and group chats)
import { useState, useRef, useEffect } from 'react';
import { ScrollView, Clipboard, Alert } from 'react-native';
import { MessageModel, ChatModel, ApiService, AuthService, socketService } from 'teamly_shared';

export const useChatViewModel = (chatId: string) => {
  const [chat, setChat] = useState<ChatModel | null>(null);
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<MessageModel | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chatId) {
      initializeChat();
      
      // Join chat room
      socketService.joinChat(chatId);
      
      // Clear unread badge for this chat
      socketService.emitClearUnread(chatId);

      // Unique listener ID for this chat
      const listenerId = `chat_${chatId}`;

      // Listen for new messages
      socketService.onNewMessage(async (data) => {
        if (data.chatId === chatId) {
          console.log('📨 Received new message via socket:', data);
          
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === data.id);
            if (exists) return prev;
            
            const newMessage: MessageModel = {
              id: data.id,
              text: data.text,
              timestamp: new Date(data.timestamp),
              isSent: data.isSent || false, // Use isSent from socket data
              status: data.status || 'delivered',
              senderName: data.senderName,
              replyTo: data.replyTo,
            };
            
            // WhatsApp-style: Mark entire chat as read when receiving new message in open chat
            if (!data.isSent) {
              AuthService.getToken().then(token => {
                if (token) {
                  markChatAsRead(token, chatId);
                }
              });
            }
            
            return [...prev, newMessage];
          });
        }
      }, listenerId);

      // Listen for status updates
      socketService.onMessageStatusUpdate((data) => {
        if (data.chatId.toString() === chatId.toString()) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id.toString() === data.messageId.toString() 
                ? { ...msg, status: data.status } 
                : msg
            )
          );
        }
      }, listenerId);

      // Listen for typing indicator
      socketService.onUserTyping((data) => {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }, listenerId);

      // Listen for message deleted (for "delete for everyone")
      socketService.onMessageDeleted((data) => {
        if (data.chatId.toString() === chatId.toString()) {
          console.log('🗑️ Message deleted by another user:', data.messageId);
          setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
        }
      }, listenerId);

      return () => {
        // Leave chat room but keep socket connected for notifications
        socketService.leaveChat(chatId);
        // Remove listeners with specific IDs to prevent memory leaks
        socketService.offNewMessage(listenerId);
        socketService.offMessageStatusUpdate(listenerId);
        socketService.offUserTyping(listenerId);
        socketService.offMessageDeleted(listenerId);
      };
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

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
    } catch (error: any) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (token: string) => {
    try {
      const response = await ApiService.getChatMessages(token, chatId);
      if (response.success) {
        const loadedMessages: MessageModel[] = response.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          timestamp: new Date(msg.timestamp),
          isSent: msg.isSent,
          senderName: msg.senderName,
          status: msg.status || 'delivered',
          replyTo: msg.replyTo,
        }));
        setMessages(loadedMessages);

        // WhatsApp-style: Mark entire chat as read in one batch operation
        const unreadReceivedMessages = loadedMessages.filter(
          msg => !msg.isSent && msg.status !== 'read'
        );
        
        if (unreadReceivedMessages.length > 0) {
          console.log(`📖 Marking chat as read (${unreadReceivedMessages.length} unread messages)`);
          markChatAsRead(token, chatId);
        }
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    }
  };

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
    } catch (error: any) {
      console.error('Failed to mark chat as read:', error);
      // Don't show alert for this background operation
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '' || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const messageText = inputText.trim();

    const tempMessage: MessageModel = {
      id: tempId,
      text: messageText,
      timestamp: new Date(),
      isSent: true,
      status: 'pending',
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
                }
              : msg
          )
        );
      } else {
        // Remove the temporary message if sending failed
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));
        Alert.alert('Error', response.message || 'Failed to send message. Please try again.');
      }
    } catch (error: any) {
      // Remove the temporary message if sending failed
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
    }
  };

  const handleReply = (message: MessageModel) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId: string) => {
    // Find message index and scroll to it
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1 && scrollViewRef.current) {
      // Estimate message height (adjust based on your message bubble height)
      const estimatedMessageHeight = 80; // Average height per message
      const scrollPosition = index * estimatedMessageHeight;
      
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true,
      });
      
      console.log('Scrolled to message:', messageId, 'at index:', index);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.length > 0) {
      socketService.sendTyping(chatId, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(chatId, false);
      }, 2000);
    } else {
      socketService.sendTyping(chatId, false);
    }
  };

  const clearAllMessages = () => {
    setMessages([]);
  };

  const refreshMessages = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;
      await loadMessages(token);
    } catch (error: any) {
      console.error('Failed to refresh messages:', error);
      Alert.alert('Error', 'Failed to refresh messages. Please try again.');
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
    const previousMessages = [...messages];
    const previousSelectedIds = [...selectedIds];
    
    try {
      const token = await AuthService.getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      // Optimistically update UI
      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
      clearSelection();

      // Perform deletion
      for (const id of selectedIds) {
        const response = await ApiService.deleteMessage(token, id, 'forMe');
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete message');
        }
      }
    } catch (error: any) {
      // Rollback on failure
      setMessages(previousMessages);
      setSelectedIds(previousSelectedIds);
      
      console.error('Delete for me failed:', error);
      Alert.alert('Error', `Failed to delete messages: ${error.message || 'Please try again'}`);
    }
  };

  // Delete for everyone - removes from all users' views via Socket.IO
  const deleteForEveryone = async () => {
    const previousMessages = [...messages];
    const previousSelectedIds = [...selectedIds];
    
    try {
      const token = await AuthService.getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      // Optimistically update UI
      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
      clearSelection();

      // Perform deletion
      for (const id of selectedIds) {
        const response = await ApiService.deleteMessage(token, id, 'forEveryone');
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete message');
        }
      }
    } catch (error: any) {
      // Rollback on failure
      setMessages(previousMessages);
      setSelectedIds(previousSelectedIds);
      
      console.error('Delete for everyone failed:', error);
      Alert.alert('Error', `Failed to delete messages: ${error.message || 'Please try again'}`);
    }
  };

  // Legacy function for backward compatibility
  const deleteSelected = async () => {
    await deleteForMe();
  };

  const copySelected = async () => {
    try {
      const text = messages
        .filter(m => selectedIds.includes(m.id))
        .map(m => m.text)
        .join('\n');
      
      await Clipboard.setString(text);
      clearSelection();
      Alert.alert('Success', 'Messages copied to clipboard');
    } catch (error: any) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', `Failed to copy messages: ${error.message || 'Please try again'}`);
    }
  };

  return {
    chat,
    messages,
    inputText,
    isLoading,
    isTyping,
    selectedIds,
    replyingTo,
    scrollViewRef,
    formatTimestamp,
    handleSend,
    handleInputChange,
    handleReply,
    cancelReply,
    scrollToMessage,
    clearAllMessages,
    refreshMessages,
    toggleSelect,
    clearSelection,
    deleteSelected,
    deleteForMe,
    deleteForEveryone,
    copySelected,
  };
};