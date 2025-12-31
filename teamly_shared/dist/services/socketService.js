"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
// Local development (your laptop) - for testing before deployment
const LOCAL_DEV_SOCKET_URL = 'http://192.168.10.125:5205';
// Company network (private IP) - production server inside company
const COMPANY_SOCKET_URL = 'http://192.168.10.194:5205';
// Public access (outside company) - when on any other WiFi
const PUBLIC_SOCKET_URL = 'http://182.70.117.46:5205';
// Get Socket URL - evaluated when socket connects
const getSocketUrl = () => {
    // Only detect in browser environment
    if (typeof globalThis !== 'undefined' && globalThis.window) {
        const hostname = globalThis.window.location.hostname;
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
// Log once for debugging
if (typeof globalThis !== 'undefined' && globalThis.window) {
    console.log('🔌 Network detected - Using Socket.IO:', getSocketUrl());
}
const SOCKET_URL = getSocketUrl();
class SocketService {
    constructor() {
        this.socket = null;
        this.userId = null;
        // Store callbacks to properly remove them later
        this.messageCallbacks = new Map();
        this.statusCallbacks = new Map();
        this.typingCallbacks = new Map();
        this.chatListCallbacks = new Map();
    }
    connect(userId) {
        if (this.socket?.connected) {
            console.log('🔌 Socket already connected');
            return;
        }
        console.log('🔌 Connecting to Socket.IO server:', SOCKET_URL);
        console.log('👤 User ID:', userId);
        this.userId = userId;
        this.socket = (0, socket_io_client_1.io)(SOCKET_URL, {
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
        });
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected. Reason:', reason);
        });
        this.socket.on('connect_error', (error) => {
            console.error('🔴 Socket connection error:', error.message);
            console.error('🔴 Error details:', error);
            console.error('🔴 Socket URL:', SOCKET_URL);
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
    isConnected() {
        return this.socket?.connected || false;
    }
    joinChat(chatId) {
        this.socket?.emit('join_chat', chatId);
        console.log('👥 Joined chat:', chatId);
    }
    leaveChat(chatId) {
        this.socket?.emit('leave_chat', chatId);
        console.log('👋 Left chat:', chatId);
    }
    sendTyping(chatId, isTyping) {
        if (this.userId) {
            this.socket?.emit('typing', { chatId, userId: this.userId, isTyping });
        }
    }
    onNewMessage(callback, listenerId = 'default') {
        // Remove existing listener with same ID first
        if (this.messageCallbacks.has(listenerId)) {
            this.socket?.off('new_message', this.messageCallbacks.get(listenerId));
        }
        this.messageCallbacks.set(listenerId, callback);
        this.socket?.on('new_message', callback);
        console.log(`📡 Added new_message listener: ${listenerId}`);
    }
    offNewMessage(listenerId = 'default') {
        const callback = this.messageCallbacks.get(listenerId);
        if (callback) {
            this.socket?.off('new_message', callback);
            this.messageCallbacks.delete(listenerId);
            console.log(`📡 Removed new_message listener: ${listenerId}`);
        }
    }
    onMessageStatusUpdate(callback, listenerId = 'default') {
        if (this.statusCallbacks.has(listenerId)) {
            this.socket?.off('message_status_update', this.statusCallbacks.get(listenerId));
        }
        this.statusCallbacks.set(listenerId, callback);
        this.socket?.on('message_status_update', callback);
    }
    offMessageStatusUpdate(listenerId = 'default') {
        const callback = this.statusCallbacks.get(listenerId);
        if (callback) {
            this.socket?.off('message_status_update', callback);
            this.statusCallbacks.delete(listenerId);
        }
    }
    onUserTyping(callback, listenerId = 'default') {
        if (this.typingCallbacks.has(listenerId)) {
            this.socket?.off('user_typing', this.typingCallbacks.get(listenerId));
        }
        this.typingCallbacks.set(listenerId, callback);
        this.socket?.on('user_typing', callback);
    }
    offUserTyping(listenerId = 'default') {
        const callback = this.typingCallbacks.get(listenerId);
        if (callback) {
            this.socket?.off('user_typing', callback);
            this.typingCallbacks.delete(listenerId);
        }
    }
    onChatListUpdate(callback, listenerId = 'default') {
        if (this.chatListCallbacks.has(listenerId)) {
            this.socket?.off('chat_list_update', this.chatListCallbacks.get(listenerId));
        }
        this.chatListCallbacks.set(listenerId, callback);
        this.socket?.on('chat_list_update', callback);
        console.log(`📡 Added chat_list_update listener: ${listenerId}`);
    }
    offChatListUpdate(listenerId = 'default') {
        const callback = this.chatListCallbacks.get(listenerId);
        if (callback) {
            this.socket?.off('chat_list_update', callback);
            this.chatListCallbacks.delete(listenerId);
            console.log(`📡 Removed chat_list_update listener: ${listenerId}`);
        }
    }
    emitClearUnread(chatId) {
        this.socket?.emit('clear_unread', { chatId });
        console.log('🔔 Cleared unread for chat:', chatId);
    }
    onClearUnread(callback) {
        this.socket?.on('clear_unread_response', callback);
    }
    offClearUnread() {
        this.socket?.off('clear_unread_response');
    }
}
exports.default = new SocketService();
