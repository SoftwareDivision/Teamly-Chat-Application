// Chat List Screen - Shows ALL chats (self, 1-to-1, group)
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, Alert } from 'react-native';
import { ChatListItem } from '../components/ChatListItem';
import { ChatContextMenu } from '../components/ChatContextMenu';
import { useChatListViewModel } from '../viewmodels/ChatListViewModel';
import { ChatModel } from 'teamly_shared';

interface ChatListScreenProps {
  onChatPress: (chatId: string, chatType: 'self' | 'private' | 'group') => void;
  userAvatar?: string;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  onChatPress,
  userAvatar,
}) => {
  const { chats, isLoading, formatTimestamp, deleteChat } = useChatListViewModel();
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatModel | null>(null);

  const handleLongPress = (chat: ChatModel) => {
    setSelectedChat(chat);
    setContextMenuVisible(true);
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete "${selectedChat.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteChat(selectedChat.id);
            if (success) {
              Alert.alert('Success', 'Chat deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderChatItem = ({ item }: { item: ChatModel }) => (
    <ChatListItem
      name={item.title}
      lastMessage={item.lastMessage}
      timestamp={formatTimestamp(item.timestamp)}
      avatar={item.type === 'self' ? userAvatar : item.avatar}
      unreadCount={item.unreadCount}
      onPress={() => onChatPress(item.id, item.type)}
      onLongPress={() => handleLongPress(item)}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No chats yet</Text>
        <Text style={styles.emptySubtext}>Start a conversation</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      
      <ChatContextMenu
        visible={contextMenuVisible}
        chatName={selectedChat?.title || ''}
        onClose={() => setContextMenuVisible(false)}
        onDelete={handleDeleteChat}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
