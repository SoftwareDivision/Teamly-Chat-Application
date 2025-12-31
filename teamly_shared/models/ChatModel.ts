// Model for Chat data (universal for self, 1-to-1, and group chats)
export interface ChatModel {
  id: string;
  type: 'self' | 'private' | 'group';
  title: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  avatar?: string;
}
