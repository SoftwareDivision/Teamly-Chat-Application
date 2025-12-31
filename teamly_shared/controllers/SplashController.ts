// Controller for Splash Screen logic
import { splashData } from '../models/SplashModel';
import { AuthService } from '../services/authService';
import { ApiService } from '../services/apiService';

export class SplashController {
  static getAppName(): string {
    return splashData.appName;
  }

  static getLogoSize(): number {
    return splashData.logoSize;
  }

  static getAnimationDuration(): number {
    return splashData.animationDuration;
  }

  static async initializeApp(): Promise<{
    isAuthenticated: boolean;
    isProfileCompleted: boolean;
  }> {
    // Wait for animation to complete
    await new Promise((resolve) => {
      setTimeout(resolve, splashData.animationDuration);
    });

    // Check authentication status
    const isAuthenticated = await AuthService.isAuthenticated();
    console.log('🔐 Token exists:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('➡️ No token found, going to login');
      return { isAuthenticated: false, isProfileCompleted: false };
    }

    // Verify token is still valid by fetching profile
    try {
      let token = await AuthService.getToken();
      if (token) {
        console.log('🔍 Validating token with API...');
        let response = await ApiService.getProfile(token);
        console.log('📥 Profile API response:', response.success, response.message);
        
        // If token expired or invalid (403), try to refresh it
        if (!response.success && (response.message?.includes('expired') || response.message?.includes('Invalid'))) {
          console.log('🔄 Access token expired/invalid, attempting refresh...');
          const refreshToken = await AuthService.getRefreshToken();
          console.log('🔑 Refresh token exists:', !!refreshToken);
          
          if (refreshToken) {
            try {
              const refreshResponse = await ApiService.refreshToken(refreshToken);
              console.log('🔄 Refresh response:', refreshResponse.success);
              
              if (refreshResponse.success && refreshResponse.token) {
                // Save new tokens
                await AuthService.saveToken(refreshResponse.token);
                if (refreshResponse.refreshToken) {
                  await AuthService.saveRefreshToken(refreshResponse.refreshToken);
                }
                console.log('✅ New tokens saved');
                
                // Retry getting profile with new token
                token = refreshResponse.token;
                response = await ApiService.getProfile(token);
                console.log('📥 Retry profile response:', response.success);
              } else {
                // Refresh failed, logout
                console.error('❌ Token refresh failed');
                await AuthService.logout();
                return { isAuthenticated: false, isProfileCompleted: false };
              }
            } catch (refreshError) {
              console.error('❌ Token refresh error:', refreshError);
              await AuthService.logout();
              return { isAuthenticated: false, isProfileCompleted: false };
            }
          } else {
            // No refresh token, logout
            console.log('❌ No refresh token, logging out');
            await AuthService.logout();
            return { isAuthenticated: false, isProfileCompleted: false };
          }
        }
        
        // Check if profile fetch was successful
        if (response.success && response.user) {
          // Update local user data
          await AuthService.saveUserData(response.user);
          
          // Check if profile is completed
          const isProfileCompleted = !!(response.user.name && response.user.phone);
          console.log('✅ User authenticated, profile complete:', isProfileCompleted);
          
          return { isAuthenticated: true, isProfileCompleted };
        } else {
          // API returned error (user not found, deleted, etc.) - clear invalid token
          console.log('❌ Profile fetch failed:', response.message, '- clearing token');
          await AuthService.logout();
          return { isAuthenticated: false, isProfileCompleted: false };
        }
      }
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      // Token is invalid, clear it
      await AuthService.logout();
      return { isAuthenticated: false, isProfileCompleted: false };
    }

    // Fallback - should not reach here, but clear token just in case
    console.log('⚠️ Unexpected state, clearing token');
    await AuthService.logout();
    return { isAuthenticated: false, isProfileCompleted: false };
  }
}
