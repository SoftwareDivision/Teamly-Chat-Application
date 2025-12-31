import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useMainViewModel } from '../viewmodels/MainViewModel';
import { ChatListScreen } from './ChatListScreen';
import { ChatScreen } from './ChatScreen';
import { ChatInfoScreen } from './ChatInfoScreen';
import { NewChatModal } from '../components/NewChatModal';
import { ChatTypeModal } from '../components/ChatTypeModal';
import { GroupCreationModal } from '../components/GroupCreationModal';
import { ApiService, AuthService } from 'teamly_shared';

interface MainScreenProps {
  onLogout?: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'teams' | 'calls' | 'profile'>('chats');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<'self' | 'private' | 'group'>('self');
  const [activeChatName, setActiveChatName] = useState<string>('');
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showChatTypeModal, setShowChatTypeModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupContacts, setGroupContacts] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const { teams, calls, userProfile, logout } = useMainViewModel(onLogout);

  const handleChatCreated = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveChatType('private');
  };

  const handleNewGroupClick = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;
      
      // Get all chats to extract contacts
      const response = await ApiService.getAllChats(token);
      if (response.success && response.chats) {
        const contacts = response.chats
          .filter((chat: any) => chat.type === 'private')
          .map((chat: any) => ({
            id: chat.chatId,
            email: chat.otherUserEmail || chat.name,
            name: chat.name,
          }));
        setGroupContacts(contacts);
        setShowGroupModal(true);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    }
  };

  const handleCreateGroup = async (groupName: string, selectedEmails: string[]) => {
    try {
      setIsCreatingGroup(true);
      const token = await AuthService.getToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      console.log('🔵 Creating group with:', { groupName, selectedEmails });
      const response = await ApiService.createGroupChat(token, groupName, selectedEmails);
      console.log('✅ Group creation response:', response);
      
      if (response.success) {
        console.log('✅ Group created successfully:', response.chatId);
        setActiveChatId(response.chatId);
        setActiveChatType('group');
        setShowGroupModal(false);
        setGroupContacts([]);
        Alert.alert('Success', 'Group created successfully');
      } else {
        console.log('❌ Group creation failed:', response.message);
        Alert.alert('Error', response.message || 'Failed to create group');
      }
    } catch (error: any) {
      console.error('❌ Failed to create group:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // If chat info screen is open, show it
  if (showChatInfo && activeChatId) {
    return (
      <ChatInfoScreen
        chatName={activeChatName}
        chatType={activeChatType}
        chatId={activeChatId}
        onBack={() => setShowChatInfo(false)}
      />
    );
  }

  // If chat screen is open, show it
  if (activeChatId) {
    return (
      <ChatScreen
        chatId={activeChatId}
        chatType={activeChatType}
        onBack={() => setActiveChatId(null)}
        onHeaderPress={(chatName) => {
          setActiveChatName(chatName);
          setShowChatInfo(true);
        }}
        userPhoto={userProfile.photo}
        userName={userProfile.name}
      />
    );
  }

  const renderTeamItem = ({ item }: any) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.avatar}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: item.color }]}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
      </View>
      <View style={styles.chatContent}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.teamMembers}>{item.members} members</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCallItem = ({ item }: any) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.avatar}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
      </View>
      <View style={styles.chatContent}>
        <Text style={styles.chatName}>{item.name}</Text>
        <View style={styles.callInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon 
              name={item.type === 'incoming' ? 'arrow-down' : item.type === 'outgoing' ? 'arrow-up' : 'close'} 
              size={14} 
              color={item.type === 'missed' ? '#FF3B30' : '#34C759'} 
            />
            <Text style={[styles.callType, item.type === 'missed' && styles.missedCall]}>
              {item.type}
            </Text>
          </View>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          {userProfile.photo ? (
            <Image source={{ uri: userProfile.photo }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitial}>{userProfile.name[0]}</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{userProfile.name}</Text>
        <Text style={styles.profileEmail}>{userProfile.email}</Text>
        <Text style={styles.profilePhone}>{userProfile.phone}</Text>
      </View>

      <View style={styles.profileOptions}>
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="settings-outline" size={24} color="#666" />
          <Text style={styles.optionText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="notifications-outline" size={24} color="#666" />
          <Text style={styles.optionText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.optionText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileOption} onPress={logout}>
          <Icon name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={[styles.optionText, { color: '#FF3B30' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teamly</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => setShowChatTypeModal(true)}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Type Modal */}
      <ChatTypeModal
        visible={showChatTypeModal}
        onNewContact={() => setShowNewChatModal(true)}
        onNewGroup={handleNewGroupClick}
        onClose={() => setShowChatTypeModal(false)}
      />

      {/* New Chat Modal */}
      <NewChatModal
        visible={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />

      {/* Group Creation Modal */}
      <GroupCreationModal
        visible={showGroupModal}
        contacts={groupContacts}
        onCreate={handleCreateGroup}
        onClose={() => setShowGroupModal(false)}
        isLoading={isCreatingGroup}
      />

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'chats' && (
          <ChatListScreen
            key={activeChatId ? 'refresh' : 'normal'}
            onChatPress={(chatId, chatType) => {
              setActiveChatId(chatId);
              setActiveChatType(chatType);
            }}
            userAvatar={userProfile.photo}
          />
        )}
        {activeTab === 'teams' && (
          <FlatList
            data={teams}
            renderItem={renderTeamItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No teams yet</Text>
              </View>
            }
          />
        )}
        {activeTab === 'calls' && (
          <FlatList
            data={calls}
            renderItem={renderCallItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No calls yet</Text>
              </View>
            }
          />
        )}
        {activeTab === 'profile' && renderProfileTab()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('chats')}
        >
          <Icon 
            name="chatbubble-ellipses" 
            size={24} 
            color={activeTab === 'chats' ? '#E91E63' : '#999'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'chats' && styles.activeTabLabel]}>
            Chats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('teams')}
        >
          <Icon 
            name="people" 
            size={24} 
            color={activeTab === 'teams' ? '#E91E63' : '#999'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'teams' && styles.activeTabLabel]}>
            Teams
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('calls')}
        >
          <Icon 
            name="call" 
            size={24} 
            color={activeTab === 'calls' ? '#E91E63' : '#999'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'calls' && styles.activeTabLabel]}>
            Calls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('profile')}
        >
          <Icon 
            name="person" 
            size={24} 
            color={activeTab === 'profile' ? '#E91E63' : '#999'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E91E63',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    fontSize: 20,
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  plusIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
  backButton: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  badge: {
    backgroundColor: '#E91E63',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamMembers: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  callType: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  missedCall: {
    color: '#f44336',
  },
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9f9f9',
  },
  profileAvatar: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
  },
  profileOptions: {
    paddingTop: 16,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#999',
  },
  activeTabLabel: {
    color: '#E91E63',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
