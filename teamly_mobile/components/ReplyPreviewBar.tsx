import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ReplyPreviewBarProps {
  senderName: string;
  messageText: string;
  onCancel: () => void;
}

export const ReplyPreviewBar: React.FC<ReplyPreviewBarProps> = ({
  senderName,
  messageText,
  onCancel,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.replyBar} />
      <View style={styles.content}>
        <Text style={styles.replyingTo}>{senderName}</Text>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {messageText}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
        <Icon name="close" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  replyBar: {
    width: 4,
    height: 40,
    backgroundColor: '#E91E63',
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  replyingTo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E91E63',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#999',
  },
});
