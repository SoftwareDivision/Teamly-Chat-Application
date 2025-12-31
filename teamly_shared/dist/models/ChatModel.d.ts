export interface ChatModel {
    id: string;
    type: 'self' | 'private' | 'group';
    title: string;
    lastMessage: string;
    timestamp: Date;
    unreadCount: number;
    avatar?: string;
}
