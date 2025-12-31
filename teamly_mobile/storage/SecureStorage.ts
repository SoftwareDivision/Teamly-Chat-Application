// Platform-specific storage implementation for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAuthStorage } from 'teamly_shared';

export class SecureStorage implements IAuthStorage {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
