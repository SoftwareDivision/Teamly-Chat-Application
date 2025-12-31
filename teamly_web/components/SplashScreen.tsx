'use client';

// Splash Screen View - WhatsApp style for Teamly - Web version
import React, { useState, useEffect } from 'react';
import { Colors, SplashController } from 'teamly_shared';
import TeamlyLogo from './TeamlyLogo';

interface SplashScreenProps {
  onComplete: (isAuthenticated: boolean, isProfileCompleted: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    // Start animation
    const timer = setTimeout(() => {
      setOpacity(1);
      setScale(1);
    }, 50);

    // Initialize app
    const initializeApp = async () => {
      const { isAuthenticated, isProfileCompleted } = await SplashController.initializeApp();
      onComplete(isAuthenticated, isProfileCompleted);
    };

    initializeApp();

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: `linear-gradient(to bottom, ${Colors.backgroundGradientTop}, ${Colors.backgroundGradientBottom})`,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: opacity,
            transform: `scale(${scale})`,
            transition: 'opacity 1s ease, transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
        >
          <TeamlyLogo size={SplashController.getLogoSize()} />
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '600',
              color: Colors.titleText,
              marginTop: '16px',
              letterSpacing: '0.5px',
            }}
          >
            {SplashController.getAppName()}
          </h1>
        </div>
      </div>

      <div
        style={{
          paddingBottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: opacity,
          transition: 'opacity 1s ease',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: Colors.subtitleGray,
            marginBottom: '4px',
          }}
        >
          from
        </p>
        <p
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: Colors.primaryDark,
            letterSpacing: '1px',
          }}
        >
          YOUR COMPANY
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
