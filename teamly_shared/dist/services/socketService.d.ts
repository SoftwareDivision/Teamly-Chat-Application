declare class SocketService {
    private socket;
    private userId;
    connect(userId: string): void;
    disconnect(): void;
    isConnected(): boolean;
    joinChat(chatId: string): void;
    leaveChat(chatId: string): void;
    sendTyping(chatId: string, isTyping: boolean): void;
    private messageCallbacks;
    private statusCallbacks;
    private typingCallbacks;
    private chatListCallbacks;
    onNewMessage(callback: (data: any) => void, listenerId?: string): void;
    offNewMessage(listenerId?: string): void;
    onMessageStatusUpdate(callback: (data: any) => void, listenerId?: string): void;
    offMessageStatusUpdate(listenerId?: string): void;
    onUserTyping(callback: (data: any) => void, listenerId?: string): void;
    offUserTyping(listenerId?: string): void;
    onChatListUpdate(callback: (data: any) => void, listenerId?: string): void;
    offChatListUpdate(listenerId?: string): void;
    emitClearUnread(chatId: string): void;
    onClearUnread(callback: (data: any) => void): void;
    offClearUnread(): void;
}
declare const _default: SocketService;
export default _default;
