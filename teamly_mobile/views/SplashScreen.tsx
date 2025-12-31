// Splash Screen View - WhatsApp style for Teamly
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSplashViewModel } from '../viewmodels/SplashViewModel';
import { Colors } from 'teamly_shared';
import TeamlyLogo from '../components/TeamlyLogo';

interface SplashScreenProps {
  onComplete: (isAuthenticated: boolean, isProfileCompleted: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { appName, logoSize, fadeAnim, scaleAnim } = useSplashViewModel(onComplete);

  return (
    <LinearGradient
      colors={[Colors.backgroundGradientTop, Colors.backgroundGradientBottom]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TeamlyLogo size={logoSize} />
          <Text style={styles.appName}>{appName}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>from</Text>
        <Text style={styles.companyName}>YOUR COMPANY</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.titleText,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.subtitleGray,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
});

export default SplashScreen;
