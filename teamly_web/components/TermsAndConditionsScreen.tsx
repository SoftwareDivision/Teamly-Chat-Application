'use client';

// Terms and Conditions Screen - Web version (Fully Responsive)
import React, { useState, useEffect } from 'react';
import { Colors } from 'teamly_shared';

interface TermsAndConditionsScreenProps {
  onBack: () => void;
}

const TermsAndConditionsScreen: React.FC<TermsAndConditionsScreenProps> = ({ onBack }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#f7f7f7',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#E91E63',
          padding: isMobile ? '12px 16px' : '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: isMobile ? '20px' : '24px',
            cursor: 'pointer',
            color: '#ffffff',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <h1
          style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            color: '#ffffff',
            margin: 0,
          }}
        >
          Terms and Conditions
        </h1>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? '16px' : '40px 20px',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '8px' : '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: isMobile ? '24px 16px' : '40px',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '100%' }}>
            <div
              style={{
                fontSize: isMobile ? '48px' : '64px',
                marginBottom: '24px',
              }}
            >
              📄
            </div>
            <h2
              style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '12px',
              }}
            >
              Terms and Conditions
            </h2>
            <p
              style={{
                fontSize: isMobile ? '14px' : '16px',
                color: '#666',
                lineHeight: '24px',
              }}
            >
              Content will be added here soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsScreen;
