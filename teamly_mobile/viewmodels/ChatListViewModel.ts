// ViewModel for Chat List Screen - Shows ALL chats (self, 1-to-1, group)
import { useState, useEffect } from 'react';
import { ChatModel, ApiService, AuthService, socketService } from 'teamly_shared';

export const useChatListViewModel = () => {
  const [chats, setChats] = useState<ChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeChats();

    // Listen for real-time chat list updates via Socket.IO
    socketService.onChatListUpdate((data) => {
      console.log('📨 Chat list update received:', data);
      updateChatInList(data);
    });

    // Listen for clear unread events
    socketService.onClearUnread((data) => {
      console.log('🔔 Clear unread received:', data);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === data.chatId.toString()
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );
    });

    // Auto-refresh every 30 seconds (reduced from 5 seconds)
    const interval = setInterval(() => {
      refreshChats();
    }, 30000);

    return () => {
      clearInterval(interval);
      socketService.offChatListUpdate();
      socketService.offClearUnread();
    };
  }, []);

  const initializeChats = async () => {
    try {
      setIsLoading(true);
      const token = await AuthService.getToken();
      if (!token) return;

      // Initialize self chat first
      await ApiService.initSelfChat(token);

      // Load all chats
      await loadAllChats(token);
    } catch (error) {
      console.error('Failed to initialize chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllChats = async (token: string) => {
    try {
      const response = await ApiService.getAllChats(token);
      if (response.success && response.chats && Array.isArray(response.chats)) {
        const loadedChats: ChatModel[] = response.chats
          .filter((chat: any) => chat && chat.chatId) // Filter out null/invalid chats
          .map((chat: any) => ({
            id: chat.chatId.toString(),
            type: chat.type || 'private',
            title: chat.name || 'Chat',
            avatar: chat.avatar || null,
            lastMessage: chat.lastMessage || 'No messages yet',
            timestamp: chat.lastMessageTime ? new Date(chat.lastMessageTime) : new Date(),
            unreadCount: chat.unreadCount || 0,
          }));
        setChats(loadedChats);
        console.log(`✅ Loaded ${loadedChats.length} chats`);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const refreshChats = async () => {
    try {
      const token = await AuthService.getToken();
      if (token) {
        await loadAllChats(token);
      }
    } catch (error) {
      console.error('Failed to refresh chats:', error);
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const updateChatInList = (data: any) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(chat => chat.id === data.chatId.toString());
      
      if (chatIndex !== -1) {
        // Update existing chat
        const updatedChats = [...prevChats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: data.lastMessage,
          timestamp: new Date(data.lastMessageTime),
          unreadCount: data.unreadCount || updatedChats[chatIndex].unreadCount,
        };
        
        // Move to top
        const [updatedChat] = updatedChats.splice(chatIndex, 1);
        return [updatedChat, ...updatedChats];
      } else {
        // Chat not in list, refresh to get it
        refreshChats();
        return prevChats;
      }
    });
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
    formatTimestamp,
    refreshChats,
    deleteChat,
  };
};
