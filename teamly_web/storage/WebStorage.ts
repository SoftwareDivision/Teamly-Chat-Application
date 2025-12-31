// Web Storage Implementation for AuthService
// Uses browser's localStorage to persist JWT tokens

import { AuthService } from 'teamly_shared';

// Initialize AuthService with localStorage adapter
export const initializeWebStorage = () => {
  AuthService.setStorage({
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve();
      } catch (error) {
        console.error('localStorage setItem error:', error);
        return Promise.reject(error);
      }
    },
    
    getItem: (key: string) => {
      try {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return Promise.resolve(null);
      }
    },
    
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch (error) {
        console.error('localStorage removeItem error:', error);
        return Promise.reject(error);
      }
    }
  });
  
  console.log('✅ Web storage initialized with localStorage');
};
