// ViewModel hook for Chat List (Web)
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatModel, ApiService, AuthService, socketService } from 'teamly_shared';

export const useChatListViewModel = () => {
  const [chats, setChats] = useState<ChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const listenersSetup = useRef(false);

  // WhatsApp-style: Update chat in list and move to top ONLY for new messages
  const updateChatInList = useCallback((data: any) => {
    console.log('🔄 Chat list update:', data);
    
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(chat => chat.id === data.chatId.toString());
      
      if (chatIndex !== -1) {
        const updatedChats = [...prevChats];
        const currentChat = updatedChats[chatIndex];
        
        // Check if this is a NEW MESSAGE (lastMessage changed) or just a read receipt
        const isNewMessage = data.lastMessage && data.lastMessage !== currentChat.lastMessage;
        
        // Update chat data
        const updatedChat = {
          ...currentChat,
          lastMessage: data.lastMessage !== undefined ? data.lastMessage : currentChat.lastMessage,
          timestamp: data.lastMessageTime ? new Date(data.lastMessageTime) : currentChat.timestamp,
          unreadCount: data.unreadCount !== undefined ? data.unreadCount : currentChat.unreadCount,
        };
        
        // Remove from current position
        updatedChats.splice(chatIndex, 1);
        
        // Only move to top if it's a NEW MESSAGE (WhatsApp behavior)
        if (isNewMessage) {
          updatedChats.unshift(updatedChat);
          console.log(`✅ NEW MESSAGE - Moved chat to top | Badge: ${updatedChat.unreadCount}`);
        } else {
          // Just update in place (for read receipts, etc.)
          updatedChats.splice(chatIndex, 0, updatedChat);
          console.log(`✅ Updated chat in place (no reorder) | Badge: ${updatedChat.unreadCount}`);
        }
        
        return updatedChats;
      } else {
        // Chat not in list, refresh
        console.log('⚠️ Chat not found, refreshing list');
        loadChats();
        return prevChats;
      }
    });
  }, []);

  // Setup socket listeners - single source of truth
  const setupSocketListeners = useCallback(() => {
    if (listenersSetup.current) {
      console.log('⚠️ Listeners already set up');
      return;
    }

    console.log('🔌 Setting up chat list socket listeners');
    listenersSetup.current = true;
    
    // Listen to chat_list_update event (sent by backend) with unique ID
    socketService.onChatListUpdate((data) => {
      console.log('📨 chat_list_update:', data);
      updateChatInList(data);
    }, 'chat_list');
  }, [updateChatInList]);

  useEffect(() => {
    loadChats();
    
    // Wait for socket to be ready, then set up listeners
    const checkAndSetup = () => {
      const isConnected = socketService.isConnected();
      console.log('🔌 Chat list checking socket status:', isConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌');
      
      if (isConnected) {
        setupSocketListeners();
      } else {
        // Retry after 1 second if not connected
        console.log('⏳ Socket not ready, retrying in 1 second...');
        setTimeout(checkAndSetup, 1000);
      }
    };

    // Start checking after a short delay
    const timer = setTimeout(checkAndSetup, 500);

    return () => {
      clearTimeout(timer);
      if (listenersSetup.current) {
        console.log('🔌 Cleaning up chat list listeners');
        socketService.offChatListUpdate('chat_list');
        listenersSetup.current = false;
      }
    };
  }, [setupSocketListeners]);

  const loadChats = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      const response = await ApiService.getAllChats(token);
      if (response.success) {
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
      setRefreshing(false);
    }
  };

  const refreshChats = async () => {
    setRefreshing(true);
    await loadChats();
  };

  const deleteChat = async (chatId: string) => {
    try {
      const token = await AuthService.getToken();
      if (!token) return false;

      const response = await ApiService.deleteChat(token, chatId);
      if (response.success) {
        // Remove chat from local state
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  };

  return {
    chats,
    isLoading,
    refreshing,
    refreshChats,
    deleteChat,
  };
};
