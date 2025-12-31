'use client';

import { useState } from 'react';
import { ProfileController, AuthService, Colors } from 'teamly_shared';

interface ProfileSetupScreenProps {
  onProfileComplete: () => void;
}

export default function ProfileSetupScreen({ onProfileComplete }: ProfileSetupScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);
  };

  const handleSubmit = async () => {
    setError('');

    const nameValidation = ProfileController.validateName(name);
    if (!nameValidation.isValid) {
      setError(nameValidation.errorMessage || 'Invalid name');
      return;
    }

    const phoneValidation = ProfileController.validatePhone(phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.errorMessage || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }

      const result = await ProfileController.updateProfile(token, { name, phone });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onProfileComplete();
        }, 1500);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(to bottom, ${Colors.backgroundGradientTop}, ${Colors.backgroundGradientBottom})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* White Centered Card/Box */}
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: Colors.primaryDark,
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Complete your profile
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: Colors.subtitleGray,
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          Please provide your details to get started
        </p>

        {/* Name Input */}
        <div style={{ marginBottom: '28px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: Colors.primaryDark,
              marginBottom: '8px',
            }}
          >
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            style={{
              width: '100%',
              fontSize: '16px',
              color: Colors.titleText,
              padding: '12px 0',
              border: 'none',
              borderBottom: `2px solid ${Colors.primaryBright}`,
              background: 'transparent',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = Colors.gradientStart;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = Colors.primaryBright;
            }}
          />
        </div>

        {/* Phone Input */}
        <div style={{ marginBottom: '32px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: Colors.primaryDark,
              marginBottom: '8px',
            }}
          >
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Enter 10-digit phone number"
            maxLength={10}
            style={{
              width: '100%',
              fontSize: '16px',
              color: Colors.titleText,
              padding: '12px 0',
              border: 'none',
              borderBottom: `2px solid ${Colors.primaryBright}`,
              background: 'transparent',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = Colors.gradientStart;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = Colors.primaryBright;
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FFEBEE',
              border: '1px solid #FFCDD2',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <p style={{ color: '#D32F2F', fontSize: '14px', margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              backgroundColor: '#E8F5E9',
              border: '1px solid #C8E6C9',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <p style={{ color: '#4CAF50', fontSize: '14px', margin: 0, textAlign: 'center' }}>
              ✓ Profile updated successfully!
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '30px',
            border: 'none',
            background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
            color: Colors.buttonText,
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 30, 99, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)';
          }}
        >
          {isLoading ? 'Updating...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}
