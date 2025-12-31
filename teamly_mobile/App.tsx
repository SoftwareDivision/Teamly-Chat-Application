// Main App Entry Point for React Native
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from './views/SplashScreen';
import EmailInputScreen from './views/EmailInputScreen';
import EmailOTPScreen from './views/EmailOTPScreen';
import ProfileSetupScreen from './views/ProfileSetupScreen';
import { MainScreen } from './views/MainScreen';
import { AuthService } from 'teamly_shared';
import { SecureStorage } from './storage/SecureStorage';

// Initialize storage for AuthService
AuthService.setStorage(new SecureStorage());

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'email' | 'otp' | 'profile' | 'home'>('splash');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  const handleSplashComplete = async (authenticated: boolean, profileCompleted: boolean) => {
    setIsAuthenticated(authenticated);
    setIsProfileCompleted(profileCompleted);
    setIsLoading(false);
    if (authenticated && profileCompleted) {
      // Load user data and go to home
      const userData = await AuthService.getUserData();
      setUserName(userData?.name || 'User');
      setCurrentScreen('home');
    } else if (!authenticated) {
      setCurrentScreen('email');
    }
  };

  const handleEmailSubmitted = (email: string) => {
    setUserEmail(email);
    setCurrentScreen('otp');
  };

  const handleWrongEmail = () => {
    setCurrentScreen('email');
  };

  const handleVerified = async (profileComplete: boolean) => {
    console.log('🎯 handleVerified called with profileComplete:', profileComplete);
    const userData = await AuthService.getUserData();
    console.log('📱 User data from storage:', JSON.stringify(userData, null, 2));
    
    setIsAuthenticated(true);
    setIsProfileCompleted(profileComplete);
    
    if (!profileComplete) {
      console.log('➡️ Navigating to profile screen');
      setCurrentScreen('profile');
    } else {
      console.log('➡️ Profile complete, navigating to home');
      setUserName(userData?.name || 'User');
      
      // Initialize push notifications after successful login
      const FCMService = require('./services/fcmService').default;
      FCMService.initialize((chatId: string) => {
        console.log('📬 Notification tapped, navigate to chat:', chatId);
        // Navigation will be handled in MainScreen
      });
      
      setCurrentScreen('home');
    }
  };

  const handleProfileComplete = async () => {
    setIsProfileCompleted(true);
    const userData = await AuthService.getUserData();
    setUserName(userData?.name || 'User');
    
    // Initialize push notifications after profile setup
    const FCMService = require('./services/fcmService').default;
    FCMService.initialize((chatId: string) => {
      console.log('📬 Notification tapped, navigate to chat:', chatId);
    });
    
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    // Unregister FCM token before logout
    const FCMService = require('./services/fcmService').default;
    await FCMService.unregisterToken();
    FCMService.unsubscribe();
    
    await AuthService.clearAll();
    setIsAuthenticated(false);
    setIsProfileCompleted(false);
    setUserName('');
    setCurrentScreen('email');
  };

  if (currentScreen === 'splash') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FDEBF2" />
        <SplashScreen onComplete={handleSplashComplete} />
      </>
    );
  }

  // Show Email Input if not authenticated
  if (currentScreen === 'email') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FDEBF2" />
        <EmailInputScreen onEmailSubmitted={handleEmailSubmitted} />
      </>
    );
  }

  // Show OTP Screen
  if (currentScreen === 'otp') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FDEBF2" />
        <EmailOTPScreen 
          email={userEmail} 
          onVerified={handleVerified}
          onWrongEmail={handleWrongEmail}
        />
      </>
    );
  }

  // Show Profile Setup Screen
  if (currentScreen === 'profile') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FDEBF2" />
        <ProfileSetupScreen onProfileComplete={handleProfileComplete} />
      </>
    );
  }

  // Show Main Screen for authenticated users
  if (currentScreen === 'home' && isAuthenticated && isProfileCompleted) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
        <MainScreen onLogout={handleLogout} />
      </>
    );
  }

  // Fallback
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A00059',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
});

export default App;
