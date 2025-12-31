import { ApiService } from '../services/apiService';

export interface ProfileData {
  name: string;
  phone: string;
  profilePhoto?: string;
}

export class ProfileController {
  static validateName(name: string): { isValid: boolean; errorMessage?: string } {
    if (!name || name.trim() === '') {
      return { isValid: false, errorMessage: 'Name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, errorMessage: 'Name must be at least 2 characters' };
    }
    return { isValid: true };
  }

  static validatePhone(phone: string): { isValid: boolean; errorMessage?: string } {
    if (!phone || phone.trim() === '') {
      return { isValid: false, errorMessage: 'Phone number is required' };
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { isValid: false, errorMessage: 'Please enter a valid 10-digit phone number' };
    }
    return { isValid: true };
  }

  static async updateProfile(token: string, profileData: ProfileData): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const response = await ApiService.updateProfile(
        token,
        profileData.name,
        profileData.phone,
        profileData.profilePhoto
      );
      return { success: response.success, message: response.message, user: response.user };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}
