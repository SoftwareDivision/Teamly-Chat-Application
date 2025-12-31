import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

interface Contact {
  id: string;
  email: string;
  name: string;
}

interface GroupCreationModalProps {
  visible: boolean;
  contacts: Contact[];
  onCreate: (groupName: string, selectedEmails: string[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const GroupCreationModal: React.FC<GroupCreationModalProps> = ({
  visible,
  contacts,
  onCreate,
  onClose,
  isLoading = false,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [step, setStep] = useState<'select' | 'name'>('select');

  const toggleContact = (email: string) => {
    setSelected(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }
    setStep('name');
  };

  const handleCreate = () => {
    if (groupName.trim() === '') {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    onCreate(groupName, selected);
    setGroupName('');
    setSelected([]);
    setStep('select');
  };

  const handleClose = () => {
    setGroupName('');
    setSelected([]);
    setStep('select');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {step === 'name' && (
            <TouchableOpacity onPress={() => setStep('select')}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>
            {step === 'select' ? 'Select Members' : 'Group Name'}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {step === 'select' ? (
          <>
            <ScrollView style={styles.list}>
              {contacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactItem}
                  onPress={() => toggleContact(contact.email)}
                >
                  <View style={styles.checkbox}>
                    {selected.includes(contact.email) && (
                      <View style={styles.checkmark} />
                    )}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactEmail}>{contact.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Next Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, selected.length === 0 && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={selected.length === 0}
              >
                <Text style={styles.buttonText}>
                  Next ({selected.length})
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.nameContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                placeholderTextColor="#999"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
              />
            </View>

            {/* Create Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, groupName.trim() === '' && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={groupName.trim() === '' || isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating...' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E91E63',
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  closeIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E91E63',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E91E63',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  nameContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E91E63',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
