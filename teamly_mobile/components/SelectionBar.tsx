import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface SelectionBarProps {
  count: number;
  onCopy: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  onCopy,
  onDelete,
  onCancel,
}) => (
  <View style={styles.bar}>
    <TouchableOpacity onPress={onCancel} style={styles.back}>
      <Icon name="close" size={24} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.count}>{count}</Text>
    <View style={styles.spacer} />
    <TouchableOpacity onPress={onCopy} style={styles.action}>
      <Text style={styles.actionText}>Copy</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onDelete} style={styles.action}>
      <Text style={styles.actionText}>Delete</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: 40,
  },
  back: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  count: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  spacer: {
    flex: 1,
  },
  action: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
});
