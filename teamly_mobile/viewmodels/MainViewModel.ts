// ViewModel for Main Screen
import { useState, useEffect } from 'react';
import { AuthService, ApiService, socketService } from 'teamly_shared';

export const useMainViewModel = (onLogout?: () => void) => {
  const [teams] = useState<any[]>([]); // Empty for now - will add teams API later
  const [calls] = useState<any[]>([]); // Empty for now - will add calls API later
  
  const [userProfile, setUserProfile] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    photo: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    initializeSocket();
  }, []);

  const initializeSocket = async () => {
    try {
      const userData = await AuthService.getUserData();
      if (userData?.id) {
        socketService.connect(userData.id.toString());
        console.log('🔌 Socket initialized for user:', userData.id);
      }
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Try to get from secure storage first
      const userData = await AuthService.getUserData();
      if (userData) {
        setUserProfile({
          name: userData.name || 'User',
          email: userData.email || '',
          phone: userData.phone || '',
          photo: userData.profilePhoto,
        });
      }

      // Fetch fresh data from backend
      const token = await AuthService.getToken();
      if (token) {
        const response = await ApiService.getProfile(token);
        if (response.success) {
          const user = response.user;
          setUserProfile({
            name: user.name || 'User',
            email: user.email || '',
            phone: user.phone || '',
            photo: user.profilePhoto,
          });
          // Update secure storage
          await AuthService.saveUserData(user);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      socketService.disconnect();
      await AuthService.clearAll();
      console.log('✅ Logged out successfully');
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    teams,
    calls,
    userProfile,
    isLoading,
    refreshProfile: loadUserProfile,
    logout: handleLogout,
  };
};
