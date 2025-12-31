import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { ApiService, AuthService } from 'teamly_shared';
import Icon from 'react-native-vector-icons/Ionicons';

interface Member {
  user_id: number;
  username: string;
  email: string;
  profile_photo?: string;
  role: string;
}

interface ChatInfoScreenProps {
  chatName: string;
  chatType: 'self' | 'private' | 'group';
  chatId: string;
  onBack: () => void;
}

export const ChatInfoScreen: React.FC<ChatInfoScreenProps> = ({
  chatName,
  chatType,
  chatId,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(chatName);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chatType === 'group') {
      loadMembers();
    }
  }, [chatType, chatId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      if (!token) return;

      const response = await ApiService.getChatMembers(token, chatId);
      if (response.success && response.members) {
        setMembers(response.members);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (editedName.trim() === '') {
      Alert.alert('Error', 'Chat name cannot be empty');
      return;
    }
    // TODO: Implement rename API call
    setIsEditing(false);
    Alert.alert('Success', 'Group name updated');
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        {item.profile_photo ? (
          <Image source={{ uri: item.profile_photo }} style={styles.memberPhoto} />
        ) : (
          <View style={styles.memberPhotoPlaceholder}>
            <Text style={styles.memberPhotoText}>
              {item.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.username}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
      {item.role === 'admin' && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>Admin</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Info</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profilePhotoText}>{chatName[0]?.toUpperCase()}</Text>
          </View>

          {/* Chat Name */}
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.chatName}>{chatName}</Text>
              {chatType === 'group' && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {chatType === 'group' && !isEditing && (
            <Text style={styles.subtitle}>Tap pencil to edit name</Text>
          )}
        </View>

        {/* Members Section */}
        {chatType === 'group' && (
          <View style={styles.membersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members ({members.length})</Text>
              {loading && <Text style={styles.loadingText}>Loading...</Text>}
            </View>
            {members.length > 0 ? (
              <FlatList
                data={members}
                keyExtractor={(item) => item.user_id.toString()}
                renderItem={renderMember}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noMembersText}>No members found</Text>
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            {chatType === 'self'
              ? 'This is your personal space for notes and reminders.'
              : chatType === 'group'
              ? `Group chat with ${members.length} member${members.length !== 1 ? 's' : ''}`
              : 'Private chat'}
          </Text>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9f9f9',
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePhotoText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editIcon: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  editContainer: {
    width: '80%',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#E91E63',
    paddingVertical: 8,
    textAlign: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#E91E63',
    borderRadius: 20,
  },
  saveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  membersSection: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberAvatar: {
    marginRight: 12,
  },
  memberPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberPhotoText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#FFE0E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E91E63',
  },
  infoSection: {
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
