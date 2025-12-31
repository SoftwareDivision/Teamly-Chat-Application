// API Service for backend communication
// Automatically switch between local dev, company network, and public access

// Local development (your laptop) - for testing before deployment
const LOCAL_DEV_API_URL = 'http://192.168.10.125:5205/api';

// Company network (private IP) - production server inside company
const COMPANY_API_URL = 'http://192.168.10.194:5205/api';

// Public access (outside company) - when on any other WiFi  
const PUBLIC_API_URL = 'http://182.70.117.46:5205/api';

// Get API URL - evaluated each time it's accessed
const getApiBaseUrl = (): string => {
  // Only detect in browser environment
  if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
    const hostname = (globalThis as any).window.location.hostname;
    
    // LOCAL DEVELOPMENT - highest priority (your laptop for testing)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.10.119')) {
      return LOCAL_DEV_API_URL;
    }
    
    // COMPANY NETWORK - production server (192.168.10.194)
    // Also recognize 172.30.x (virtual adapter on company network)
    if (hostname.startsWith('192.168.10.') || hostname.startsWith('172.30.')) {
      return COMPANY_API_URL;
    }
  }
  
  // Default to public backend (for server-side rendering or other networks)
  return PUBLIC_API_URL;
};

// Log once for debugging
if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
  console.log('🌐 Network detected - Using backend:', getApiBaseUrl());
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    name?: string;
    phone?: string;
    profilePhoto?: string;
    isProfileComplete: boolean;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}

export class ApiService {
  static async sendOTP(email: string): Promise<SendOTPResponse> {
    try {
      console.log('📤 Sending OTP to:', email);
      console.log('🔗 API URL:', `${getApiBaseUrl()}/auth/send-otp`);
      
      const response = await fetch(`${getApiBaseUrl()}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('✅ OTP Response:', data);
      return data as SendOTPResponse;
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      throw new Error('Failed to send OTP. Please check your connection.');
    }
  }

  static async verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      console.log('🔐 Verifying OTP for:', email);
      const response = await fetch(`${getApiBaseUrl()}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json() as VerifyOTPResponse;
      console.log('✅ Verify OTP Response:', data);
      console.log('📋 isProfileComplete:', data.user?.isProfileComplete);
      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw new Error('Failed to verify OTP. Please check your connection.');
    }
  }

  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json() as RefreshTokenResponse;
      if (data.success) {
        console.log('✅ Token refreshed successfully');
      }
      return data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new Error('Failed to refresh token. Please login again.');
    }
  }

  static async updateProfile(
    token: string,
    name: string,
    phone: string,
    profilePhoto?: string
  ): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, profilePhoto }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile. Please check your connection.');
    }
  }

  static async getProfile(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/profile/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error('Failed to get profile. Please check your connection.');
    }
  }

  // Chat APIs
  static async initSelfChat(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/self/init`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Init self chat error:', error);
      throw error;
    }
  }

  static async getAllChats(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/list`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get all chats error:', error);
      throw error;
    }
  }

  static async createSingleChatByEmail(token: string, email: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/single/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error('Create single chat error:', error);
      throw error;
    }
  }

  static async deleteChat(token: string, chatId: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Delete chat error:', error);
      throw error;
    }
  }

  static async createGroupChat(token: string, groupName: string, memberEmails: string[]): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/group/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupName, memberEmails }),
      });
      return await response.json();
    } catch (error) {
      console.error('Create group chat error:', error);
      throw error;
    }
  }

  // Message APIs
  static async getChatDetails(token: string, chatId: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get chat details error:', error);
      throw error;
    }
  }

  static async getChatMembers(token: string, chatId: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}/members`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get chat members error:', error);
      throw error;
    }
  }

  static async getChatMessages(token: string, chatId: string, limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}/messages?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get chat messages error:', error);
      throw error;
    }
  }

  static async sendMessage(
    token: string, 
    chatId: string, 
    text: string, 
    replyToId?: string,
    driveFileData?: {
      driveLink?: string;
      driveFileId?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }
  ): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text, 
          replyToId,
          ...driveFileData 
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  static async updateMessageStatus(token: string, messageId: string, status: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return await response.json();
    } catch (error) {
      console.error('Update message status error:', error);
      throw error;
    }
  }

  static async deleteMessage(
    token: string, 
    messageId: string, 
    deleteType: 'forMe' | 'forEveryone' = 'forMe'
  ): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleteType }),
      });
      return await response.json();
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  // WhatsApp-style: Mark entire chat as read in one batch operation
  static async markChatAsRead(token: string, chatId: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Mark chat as read error:', error);
      throw error;
    }
  }

  // FCM Token APIs
  static async registerFCMToken(token: string, deviceToken: string, deviceName: string, deviceType: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/fcm/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceToken, deviceName, deviceType }),
      });
      return await response.json();
    } catch (error) {
      console.error('Register FCM token error:', error);
      throw error;
    }
  }

  static async unregisterFCMToken(token: string, deviceToken: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/fcm/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceToken }),
      });
      return await response.json();
    } catch (error) {
      console.error('Unregister FCM token error:', error);
      throw error;
    }
  }

  // Upload APIs
  static async uploadFile(token: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiBaseUrl()}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  static async sendMessageWithMedia(
    token: string,
    chatId: string,
    text: string,
    documentId: string,
    replyToId?: string
  ): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, documentId, replyToId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send message with media error:', error);
      throw error;
    }
  }

  static async getUserDocuments(token: string, type?: string, limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`${getApiBaseUrl()}/documents?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get user documents error:', error);
      throw error;
    }
  }

  static async getStorageUsage(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/storage/usage`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get storage usage error:', error);
      throw error;
    }
  }

  // Google Drive APIs
  static async getGoogleDriveAuthUrl(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/google-drive/auth-url`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get Drive auth URL error:', error);
      throw error;
    }
  }

  static async handleGoogleDriveCallback(token: string, code: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/google-drive/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      return await response.json();
    } catch (error) {
      console.error('Drive callback error:', error);
      throw error;
    }
  }

  static async checkGoogleDriveStatus(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/google-drive/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Check Drive status error:', error);
      throw error;
    }
  }

  static async getGoogleDriveToken(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/google-drive/token`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get Drive token error:', error);
      throw error;
    }
  }

  static async disconnectGoogleDrive(token: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/google-drive/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Disconnect Drive error:', error);
      throw error;
    }
  }
}
