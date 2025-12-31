// ViewModel hook for Main Screen (Web)
import { useState, useEffect } from 'react';
import { AuthService, ApiService, socketService } from 'teamly_shared';

export const useMainViewModel = (onLogout?: () => void) => {
  const [teams] = useState<any[]>([]);
  const [calls] = useState<any[]>([]);
  
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
      console.log('👤 User data for socket:', userData);
      if (userData?.id) {
        console.log('🔌 Connecting socket for user:', userData.id);
        socketService.connect(userData.id.toString());
        
        // Wait a bit and check connection
        setTimeout(() => {
          const isConnected = socketService.isConnected();
          console.log('🔌 Socket connection status:', isConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌');
        }, 2000);
      } else {
        console.log('⚠️ No user ID found, cannot initialize socket');
      }
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userData = await AuthService.getUserData();
      if (userData) {
        setUserProfile({
          name: userData.name || 'User',
          email: userData.email || '',
          phone: userData.phone || '',
          photo: userData.profilePhoto,
        });
      }

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

  // Update user profile locally (called after successful API update)
  const updateUserProfile = (updatedProfile: Partial<typeof userProfile>) => {
    setUserProfile(prev => ({
      ...prev,
      ...updatedProfile,
    }));
  };

  return {
    teams,
    calls,
    userProfile,
    isLoading,
    refreshProfile: loadUserProfile,
    updateUserProfile,
    logout: handleLogout,
  };
};
