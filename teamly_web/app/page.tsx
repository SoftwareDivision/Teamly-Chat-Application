'use client';

// Main App Entry Point for Next.js Web
import { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';
import EmailInputScreen from '../components/EmailInputScreen';
import EmailOTPScreen from '../components/EmailOTPScreen';
import ProfileSetupScreen from '../components/ProfileSetupScreen';
import MainScreen from '../components/MainScreen';
import { AuthService } from 'teamly_shared';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'email' | 'otp' | 'profile' | 'home'>('splash');
  const [userEmail, setUserEmail] = useState('');

  const handleSplashComplete = async (authenticated: boolean, profileCompleted: boolean) => {
    setIsAuthenticated(authenticated);
    setIsProfileCompleted(profileCompleted);
    if (authenticated && profileCompleted) {
      setCurrentScreen('home');
    } else if (authenticated && !profileCompleted) {
      // User is logged in but needs to complete profile
      setCurrentScreen('profile');
    } else {
      // Not authenticated
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
    setIsAuthenticated(true);
    setIsProfileCompleted(profileComplete);
    if (!profileComplete) {
      console.log('➡️ Navigating to profile screen');
      setCurrentScreen('profile');
    } else {
      console.log('➡️ Profile complete, navigating to home');
      setCurrentScreen('home');
    }
  };

  const handleProfileComplete = async () => {
    setIsProfileCompleted(true);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    await AuthService.clearAll();
    setIsAuthenticated(false);
    setIsProfileCompleted(false);
    setCurrentScreen('email');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show Email Input
  if (currentScreen === 'email') {
    return <EmailInputScreen onEmailSubmitted={handleEmailSubmitted} />;
  }

  // Show OTP Screen
  if (currentScreen === 'otp') {
    return (
      <EmailOTPScreen 
        email={userEmail} 
        onVerified={handleVerified}
        onWrongEmail={handleWrongEmail}
      />
    );
  }

  // Show Profile Setup Screen
  if (currentScreen === 'profile') {
    return <ProfileSetupScreen onProfileComplete={handleProfileComplete} />;
  }

  // Show Main Screen for authenticated users
  if (currentScreen === 'home' && isAuthenticated && isProfileCompleted) {
    return <MainScreen onLogout={handleLogout} />;
  }

  // Fallback
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Loading...</h1>
    </div>
  );
}
