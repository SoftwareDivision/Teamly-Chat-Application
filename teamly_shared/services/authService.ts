// Authentication Service - Platform-agnostic interface
// Platform-specific implementations will be in mobile/web projects

export interface IAuthStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_EMAIL_KEY = 'userEmail';
const USER_DATA_KEY = 'userData';

export class AuthService {
  private static storage: IAuthStorage;

  static setStorage(storage: IAuthStorage) {
    this.storage = storage;
  }

  // Save auth token securely
  static async saveToken(token: string): Promise<void> {
    try {
      await this.storage.setItem(TOKEN_KEY, token);
      console.log('✅ Token saved securely');
    } catch (error) {
      console.error('Failed to save token:', error);
      throw error;
    }
  }

  // Get auth token
  static async getToken(): Promise<string | null> {
    try {
      const token = await this.storage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // Save refresh token securely
  static async saveRefreshToken(refreshToken: string): Promise<void> {
    try {
      await this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      console.log('✅ Refresh token saved securely');
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      throw error;
    }
  }

  // Get refresh token
  static async getRefreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.storage.getItem(REFRESH_TOKEN_KEY);
      return refreshToken;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  // Save user email
  static async saveEmail(email: string): Promise<void> {
    try {
      await this.storage.setItem(USER_EMAIL_KEY, email);
    } catch (error) {
      console.error('Failed to save email:', error);
    }
  }

  // Get user email
  static async getEmail(): Promise<string | null> {
    try {
      return await this.storage.getItem(USER_EMAIL_KEY);
    } catch (error) {
      console.error('Failed to get email:', error);
      return null;
    }
  }

  // Save user data (profile info)
  static async saveUserData(userData: any): Promise<void> {
    try {
      const essentialData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        profilePhoto: userData.profilePhoto,
        isProfileComplete: userData.isProfileComplete,
      };
      await this.storage.setItem(USER_DATA_KEY, JSON.stringify(essentialData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  // Get user data
  static async getUserData(): Promise<any | null> {
    try {
      const data = await this.storage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  // Check if profile is completed
  static async isProfileCompleted(): Promise<boolean> {
    const userData = await this.getUserData();
    return userData && userData.name && userData.phone;
  }

  // Logout - clear all auth data
  static async logout(): Promise<void> {
    try {
      await this.storage.removeItem(TOKEN_KEY);
      await this.storage.removeItem(REFRESH_TOKEN_KEY);
      await this.storage.removeItem(USER_EMAIL_KEY);
      await this.storage.removeItem(USER_DATA_KEY);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    await this.logout();
  }
}
