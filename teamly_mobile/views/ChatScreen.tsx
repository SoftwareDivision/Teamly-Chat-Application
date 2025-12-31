// Universal Chat Screen - Handles self, 1-to-1, and group chats
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { MessageBubble } from '../components/MessageBubble';
import { SelectionBar } from '../components/SelectionBar';
import { ReplyPreviewBar } from '../components/ReplyPreviewBar';
import { TypingIndicator } from '../components/TypingIndicator';
import { DriveFileUploadButton } from '../components/DriveFileUploadButton';
import { useChatViewModel } from '../viewmodels/ChatViewModel';
import Icon from 'react-native-vector-icons/Ionicons';

interface ChatScreenProps {
  chatId: string;
  chatType: 'self' | 'private' | 'group';
  onBack: () => void;
  onHeaderPress?: (chatName: string) => void;
  userPhoto?: string;
  userName: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  chatId,
  chatType,
  onBack,
  onHeaderPress,
  userPhoto,
  userName,
}) => {
  const {
    chat,
    messages,
    inputText,
    isLoading,
    selectedIds,
    scrollViewRef,
    replyingTo,
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
    copySelected,
  } = useChatViewModel(chatId);

  const selectionMode = selectedIds.length > 0;

  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = messages
        .filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(msg => msg.id);
      setSearchResults(results);
      setCurrentSearchIndex(0);
      // Auto-scroll to first result
      if (results.length > 0) {
        scrollToMessage(results[0]);
      }
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchQuery, messages]);

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMessages();
    setRefreshing(false);
  };

  const handleClearChat = () => {
    clearAllMessages();
    Alert.alert('Success', 'All messages cleared');
  };

  // Show loading while chat is being fetched
  if (isLoading && !chat) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Loading...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Selection Bar or Header */}
      {selectionMode ? (
        <SelectionBar
          count={selectedIds.length}
          onCopy={copySelected}
          onDelete={deleteSelected}
          onCancel={clearSelection}
        />
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerTitleContainer}
            onPress={() => onHeaderPress && onHeaderPress(chat?.title || '')}
          >
            <Text style={styles.headerTitle}>{chat?.title || 'Loading...'}</Text>
            {chatType === 'self' && !isTyping && (
              <Text style={styles.headerSubtitle}>message yourself</Text>
            )}
            {isTyping && (
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>typing</Text>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      {showSearch && !selectionMode && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchResults.length > 0 && (
            <View style={styles.searchNavigation}>
              <Text style={styles.searchCount}>
                {currentSearchIndex + 1}/{searchResults.length}
              </Text>
              <TouchableOpacity onPress={() => navigateSearch('prev')} style={{ padding: 4 }}>
                <Icon name="chevron-up" size={18} color="#E91E63" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateSearch('next')} style={{ padding: 4 }}>
                <Icon name="chevron-down" size={18} color="#E91E63" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => {
            setShowSearch(false);
            setSearchQuery('');
          }}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#E91E63']}
            tintColor="#E91E63"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              {chatType === 'self'
                ? 'Start typing to create your first note'
                : 'Start the conversation'}
            </Text>
          </View>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                id={message.id}
                text={message.text}
                timestamp={formatTimestamp(message.timestamp)}
                isSent={message.isSent}
                status={message.status}
                replyTo={message.replyTo}
                isSelected={selectedIds.includes(message.id)}
                selectionMode={selectionMode}
                onLongPress={() => toggleSelect(message.id)}
                onPress={() => selectionMode && toggleSelect(message.id)}
                onReply={() => handleReply(message)}
                onReplyPress={() => message.replyTo && scrollToMessage(message.replyTo.id)}
                isHighlighted={searchResults.length > 0 && message.id === searchResults[currentSearchIndex]}
              />
            ))}
            {isTyping && (
              <View style={styles.typingBubbleContainer}>
                <View style={styles.typingBubble}>
                  <TypingIndicator />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Reply Preview Bar */}
      {replyingTo && !selectionMode && (
        <ReplyPreviewBar
          senderName={replyingTo.isSent ? 'You' : (replyingTo.senderName || 'User')}
          messageText={replyingTo.text}
          onCancel={cancelReply}
        />
      )}

      {/* Input (hidden in selection mode) - WhatsApp Style */}
      {!selectionMode && (
        <View style={styles.inputContainer}>
          {/* Input Box with Attachment Icon Inside */}
          <View style={styles.inputWrapper}>
            <View style={styles.attachmentIconWrapper}>
              <DriveFileUploadButton
                onUploadSuccess={(fileData) => {
                  console.log('📤 File uploaded:', fileData);
                  // TODO: Send message with Drive link
                  Alert.alert('Success', `File uploaded: ${fileData.fileName}`);
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  Alert.alert('Error', error);
                }}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
              textAlignVertical="center"
            />
          </View>
          
          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={inputText.trim() === ''}
          >
            <Icon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E91E63',
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#d1d7db',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attachmentIconWrapper: {
    paddingHorizontal: 4,
  },
  attachButton: {
    padding: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 24,
    maxHeight: 120,
    fontSize: 15,
    color: '#111',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  searchNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  searchCount: {
    fontSize: 12,
    color: '#666',
  },
  searchArrow: {
    fontSize: 18,
    color: '#E91E63',
    paddingHorizontal: 8,
  },
  searchClose: {
    fontSize: 20,
    color: '#666',
    paddingHorizontal: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#e0e0e0',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  typingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#e0e0e0',
  },
  typingBubbleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
