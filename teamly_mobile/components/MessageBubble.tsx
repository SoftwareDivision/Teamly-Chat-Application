// Message Bubble Component - WhatsApp style
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
// Temporarily remove LinearGradient to fix the undefined component error
// import LinearGradient from 'react-native-linear-gradient';
import { Colors } from 'teamly_shared';
import { GoogleDriveService } from '../services/googleDriveService';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageBubbleProps {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  isSelected?: boolean;
  selectionMode?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  onReply?: () => void;
  replyTo?: {
    id: string;
    text: string;
    senderName?: string;
  };
  onReplyPress?: () => void;
  isHighlighted?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  text,
  timestamp,
  isSent,
  status = 'delivered',
  isSelected = false,
  selectionMode = false,
  onLongPress,
  onPress,
  onReply,
  replyTo,
  onReplyPress,
  isHighlighted = false,
}) => {
  // Helper function to handle link press
  const handleLinkPress = async (url: string) => {
    // Check if it's a Google Drive link
    if (GoogleDriveService.isDriveLink(url)) {
      // Download the file instead of opening
      await GoogleDriveService.downloadFile(url);
    } else {
      // Open other links normally
      await Linking.openURL(url);
    }
  };

  // Helper function to render text with clickable links
  const renderTextWithLinks = (text: string, isSentMessage: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return (
      <Text style={isSentMessage ? styles.sentText : styles.receivedText}>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            const isDriveLink = GoogleDriveService.isDriveLink(part);
            return (
              <Text
                key={index}
                style={[styles.linkText, isDriveLink && styles.driveLinkText]}
                onPress={() => handleLinkPress(part)}
              >
                {isDriveLink ? '📎 Drive File' : part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Icon name="time-outline" size={14} color="#fff" style={{ opacity: 0.7 }} />;
      case 'sent':
        return <Icon name="checkmark" size={16} color="#fff" style={{ opacity: 0.7 }} />;
      case 'delivered':
        return <Icon name="checkmark-done" size={16} color="#fff" style={{ opacity: 0.7 }} />;
      case 'read':
        return <Icon name="checkmark-done" size={16} color="#4FC3F7" />;
      default:
        return null;
    }
  };

  const isInteractive = selectionMode || onLongPress;

  if (isSent) {
    const content = (
      <View style={styles.sentBubble}>
        {replyTo && (
          <TouchableOpacity style={styles.replyPreview} onPress={onReplyPress}>
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={styles.replyName}>{replyTo.senderName || 'User'}</Text>
              <Text style={styles.replyText} numberOfLines={1}>{replyTo.text}</Text>
            </View>
          </TouchableOpacity>
        )}
        {renderTextWithLinks(text, true)}
        <View style={styles.sentFooter}>
          <Text style={styles.sentTimestamp}>{timestamp}</Text>
          {renderStatusIcon()}
        </View>
      </View>
    );

    if (isInteractive) {
      return (
        <TouchableOpacity
          style={[styles.container, styles.sentContainer, isSelected && styles.selected]}
          onLongPress={onLongPress}
          onPress={onPress}
          delayLongPress={400}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.container, styles.sentContainer, isSelected && styles.selected]}>
        {content}
      </View>
    );
  }

  const receivedContent = (
    <View style={styles.receivedRow}>
      <View style={styles.receivedBubble}>
        {replyTo && (
          <TouchableOpacity style={styles.replyPreviewReceived} onPress={onReplyPress}>
            <View style={styles.replyBarReceived} />
            <View style={styles.replyContent}>
              <Text style={styles.replyNameReceived}>{replyTo.senderName || 'User'}</Text>
              <Text style={styles.replyTextReceived} numberOfLines={1}>{replyTo.text}</Text>
            </View>
          </TouchableOpacity>
        )}
        {renderTextWithLinks(text, false)}
        <Text style={styles.receivedTimestamp}>{timestamp}</Text>
      </View>
      {!selectionMode && (
        <TouchableOpacity style={styles.replyButton} onPress={onReply}>
          <Icon name="arrow-undo" size={18} color={Colors.primaryBright} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.receivedContainer, isSelected && styles.selected]}
        onLongPress={onLongPress}
        onPress={onPress}
        delayLongPress={400}
      >
        {receivedContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, styles.receivedContainer, isSelected && styles.selected]}>
      {receivedContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  sentBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderBottomRightRadius: 4,
    backgroundColor: Colors.primaryBright, // Using theme color instead of hardcoded #E91E63
  },
  receivedBubble: {
    maxWidth: '75%',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
  },
  sentText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 4,
  },
  receivedText: {
    color: '#333',
    fontSize: 15,
    marginBottom: 4,
  },
  sentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  sentTimestamp: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: '#666',
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  statusIcon: {
    fontSize: 12,
    opacity: 0.7,
  },
  singleTick: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
    fontWeight: 'bold',
  },
  doubleTick: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
    fontWeight: 'bold',
  },
  doubleTickRead: {
    color: '#4FC3F7',
    opacity: 1,
  },
  selected: {
    backgroundColor: `rgba(233, 30, 99, 0.1)`, // Using rgba version of primary color for selection
  },
  receivedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  replyButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyIcon: {
    fontSize: 18,
    color: Colors.primaryBright, // Using theme color instead of hardcoded #E91E63
  },
  replyPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
  },
  replyPreviewReceived: {
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
  },
  replyBar: {
    width: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarReceived: {
    width: 4,
    backgroundColor: Colors.primaryBright, // Using theme color instead of hardcoded #E91E63
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  replyNameReceived: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryBright, // Using theme color instead of hardcoded #E91E63
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },
  replyTextReceived: {
    fontSize: 13,
    color: '#666',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#0066CC',
  },
  driveLinkText: {
    fontWeight: '600',
  },
});