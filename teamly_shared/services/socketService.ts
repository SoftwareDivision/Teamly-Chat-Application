import { io, Socket } from 'socket.io-client';

// Local development (your laptop) - for testing before deployment
const LOCAL_DEV_SOCKET_URL = 'http://192.168.10.125:5205';

// Company network (private IP) - production server inside company
const COMPANY_SOCKET_URL = 'http://192.168.10.194:5205';

// Public access (outside company) - when on any other WiFi
const PUBLIC_SOCKET_URL = 'http://182.70.117.46:5205';

// Get Socket URL - evaluated when socket connects
const getSocketUrl = (): string => {
  // Only detect in browser environment
  if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
    const hostname = (globalThis as any).window.location.hostname;
    
    // LOCAL DEVELOPMENT - highest priority (your laptop for testing)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.10.119')) {
      return LOCAL_DEV_SOCKET_URL;
    }
    
    // COMPANY NETWORK - production server (192.168.10.194)
    if (hostname.startsWith('192.168.10.')) {
      return COMPANY_SOCKET_URL;
    }
  }
  
  // Default to public backend (for server-side rendering or other networks)
  return PUBLIC_SOCKET_URL;
};

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private pendingListeners: Map<string, { event: string; callback: (data: any) => void }> = new Map();

  connect(userId: string) {
    // Get URL dynamically at connect time (not at module load)
    const socketUrl = getSocketUrl();
    
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    console.log('🔌 Connecting to Socket.IO server:', socketUrl);
    console.log('👤 User ID:', userId);

    this.userId = userId;
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      console.log('🆔 Socket ID:', this.socket?.id);
      if (this.userId) {
        this.socket?.emit('register', this.userId);
        console.log('📝 Registered user:', this.userId);
      }
      
      // Re-attach any pending listeners that were added before connection
      this.reattachPendingListeners();
    });

    // Debug: Log ALL events for troubleshooting
    this.socket.on('new_message', (data) => {
      console.log('🔔 [DEBUG] new_message event received:', data);
    });
    
    this.socket.on('chat_list_update', (data) => {
      console.log('🔔 [DEBUG] chat_list_update event received:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      console.error('🔴 Error details:', error);
      console.error('🔴 Socket URL:', socketUrl);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      // Re-register user after reconnection
      if (this.userId) {
        this.socket?.emit('register', this.userId);
        console.log('📝 Re-registered user after reconnection:', this.userId);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔴 Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔴 Reconnection failed after all attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinChat(chatId: string) {
    this.socket?.emit('join_chat', chatId);
    console.log('👥 Joined chat:', chatId);
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', chatId);
    console.log('👋 Left chat:', chatId);
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (this.userId) {
      this.socket?.emit('typing', { chatId, userId: this.userId, isTyping });
    }
  }

  // Store callbacks to properly remove them later
  private messageCallbacks: Map<string, (data: any) => void> = new Map();
  private statusCallbacks: Map<string, (data: any) => void> = new Map();
  private typingCallbacks: Map<string, (data: any) => void> = new Map();
  private chatListCallbacks: Map<string, (data: any) => void> = new Map();

  onNewMessage(callback: (data: any) => void, listenerId: string = 'default') {
    // Remove existing listener with same ID first
    if (this.messageCallbacks.has(listenerId)) {
      this.socket?.off('new_message', this.messageCallbacks.get(listenerId));
    }
    this.messageCallbacks.set(listenerId, callback);
    
    if (this.socket) {
      this.socket.on('new_message', callback);
      console.log(`📡 Added new_message listener: ${listenerId} (socket connected: ${this.socket.connected})`);
    } else {
      // Store for later attachment when socket connects
      this.pendingListeners.set(`message_${listenerId}`, { event: 'new_message', callback });
      console.warn(`⚠️ Socket not ready, queued new_message listener: ${listenerId}`);
    }
  }

  offNewMessage(listenerId: string = 'default') {
    const callback = this.messageCallbacks.get(listenerId);
    if (callback) {
      this.socket?.off('new_message', callback);
      this.messageCallbacks.delete(listenerId);
      this.pendingListeners.delete(`message_${listenerId}`);
      console.log(`📡 Removed new_message listener: ${listenerId}`);
    }
  }

  onMessageStatusUpdate(callback: (data: any) => void, listenerId: string = 'default') {
    if (this.statusCallbacks.has(listenerId)) {
      this.socket?.off('message_status_update', this.statusCallbacks.get(listenerId));
    }
    this.statusCallbacks.set(listenerId, callback);
    this.socket?.on('message_status_update', callback);
  }

  offMessageStatusUpdate(listenerId: string = 'default') {
    const callback = this.statusCallbacks.get(listenerId);
    if (callback) {
      this.socket?.off('message_status_update', callback);
      this.statusCallbacks.delete(listenerId);
    }
  }

  onUserTyping(callback: (data: any) => void, listenerId: string = 'default') {
    if (this.typingCallbacks.has(listenerId)) {
      this.socket?.off('user_typing', this.typingCallbacks.get(listenerId));
    }
    this.typingCallbacks.set(listenerId, callback);
    this.socket?.on('user_typing', callback);
  }

  offUserTyping(listenerId: string = 'default') {
    const callback = this.typingCallbacks.get(listenerId);
    if (callback) {
      this.socket?.off('user_typing', callback);
      this.typingCallbacks.delete(listenerId);
    }
  }

  onChatListUpdate(callback: (data: any) => void, listenerId: string = 'default') {
    // Remove existing listener with same ID first
    if (this.chatListCallbacks.has(listenerId)) {
      this.socket?.off('chat_list_update', this.chatListCallbacks.get(listenerId));
    }
    this.chatListCallbacks.set(listenerId, callback);
    
    if (this.socket) {
      this.socket.on('chat_list_update', callback);
      console.log(`📡 Added chat_list_update listener: ${listenerId} (socket connected: ${this.socket.connected})`);
    } else {
      // Store for later attachment when socket connects
      this.pendingListeners.set(`chatList_${listenerId}`, { event: 'chat_list_update', callback });
      console.warn(`⚠️ Socket not ready, queued chat_list_update listener: ${listenerId}`);
    }
  }

  offChatListUpdate(listenerId: string = 'default') {
    const callback = this.chatListCallbacks.get(listenerId);
    if (callback) {
      this.socket?.off('chat_list_update', callback);
      this.chatListCallbacks.delete(listenerId);
      this.pendingListeners.delete(`chatList_${listenerId}`);
      console.log(`📡 Removed chat_list_update listener: ${listenerId}`);
    }
  }

  // Re-attach listeners that were added before socket connected
  private reattachPendingListeners() {
    if (this.pendingListeners.size === 0) return;
    
    console.log(`🔄 Re-attaching ${this.pendingListeners.size} pending listeners...`);
    
    for (const [key, { event, callback }] of this.pendingListeners) {
      if (this.socket) {
        this.socket.on(event, callback);
        console.log(`📡 Attached pending listener: ${key} -> ${event}`);
      }
    }
    
    this.pendingListeners.clear();
  }

  emitClearUnread(chatId: string) {
    this.socket?.emit('clear_unread', { chatId });
    console.log('🔔 Cleared unread for chat:', chatId);
  }

  onClearUnread(callback: (data: any) => void) {
    this.socket?.on('clear_unread_response', callback);
  }

  offClearUnread() {
    this.socket?.off('clear_unread_response');
  }

  // Message deleted listener (for "delete for everyone")
  private deleteCallbacks: Map<string, (data: any) => void> = new Map();

  onMessageDeleted(callback: (data: any) => void, listenerId: string = 'default') {
    if (this.deleteCallbacks.has(listenerId)) {
      this.socket?.off('message_deleted', this.deleteCallbacks.get(listenerId));
    }
    this.deleteCallbacks.set(listenerId, callback);
    
    if (this.socket) {
      this.socket.on('message_deleted', callback);
      console.log(`📡 Added message_deleted listener: ${listenerId}`);
    } else {
      this.pendingListeners.set(`delete_${listenerId}`, { event: 'message_deleted', callback });
      console.warn(`⚠️ Socket not ready, queued message_deleted listener: ${listenerId}`);
    }
  }

  offMessageDeleted(listenerId: string = 'default') {
    const callback = this.deleteCallbacks.get(listenerId);
    if (callback) {
      this.socket?.off('message_deleted', callback);
      this.deleteCallbacks.delete(listenerId);
      this.pendingListeners.delete(`delete_${listenerId}`);
      console.log(`📡 Removed message_deleted listener: ${listenerId}`);
    }
  }
}

export default new SocketService();
