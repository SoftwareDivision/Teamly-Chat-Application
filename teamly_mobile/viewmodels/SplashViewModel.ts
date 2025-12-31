// ViewModel for Splash Screen
import { useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { SplashController } from 'teamly_shared';

export const useSplashViewModel = (
  onComplete: (isAuthenticated: boolean, isProfileCompleted: boolean) => void
) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    startAnimation();
    initializeApp();
  }, []);

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const initializeApp = async () => {
    const { isAuthenticated, isProfileCompleted } = await SplashController.initializeApp();
    onComplete(isAuthenticated, isProfileCompleted);
  };

  return {
    appName: SplashController.getAppName(),
    logoSize: SplashController.getLogoSize(),
    fadeAnim,
    scaleAnim,
  };
};
