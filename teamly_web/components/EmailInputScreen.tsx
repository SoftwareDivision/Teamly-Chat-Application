'use client';

// Email Input Screen View - Web version
import React, { useState } from 'react';
import { Colors, EmailVerificationController } from 'teamly_shared';
import TermsAndConditionsScreen from './TermsAndConditionsScreen';

interface EmailInputScreenProps {
  onEmailSubmitted: (email: string) => void;
}

const EmailInputScreen: React.FC<EmailInputScreenProps> = ({ onEmailSubmitted }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase().trim());
    setError('');
  };

  const handleNext = async () => {
    // Check if terms are agreed
    if (!agreedToTerms) {
      setError('Please agree to the Terms and Conditions to continue');
      return;
    }

    // Validate email with detailed error messages
    const validation = EmailVerificationController.validateEmailWithMessage(email);
    
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const success = await EmailVerificationController.sendVerificationCode(email);
      if (success) {
        setShowModal(true);
      }
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    onEmailSubmitted(email);
  };

  // Show Terms and Conditions screen
  if (showTerms) {
    return <TermsAndConditionsScreen onBack={() => setShowTerms(false)} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f7f7f7',
        padding: '20px',
      }}
    >
      {/* Centered Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '440px',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: Colors.primaryDark,
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Welcome to Teamly
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#666',
            textAlign: 'center',
            lineHeight: '22px',
            marginBottom: '32px',
          }}
        >
          Enter your email to get started
        </p>

        {/* Email Input */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333',
              marginBottom: '8px',
            }}
          >
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            style={{
              fontSize: '16px',
              color: '#333',
              padding: '12px 16px',
              width: '90%',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              background: '#fff',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = Colors.primaryBright}
            onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
          />
        </div>

        {/* Terms and Conditions Checkbox */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <input
            type="checkbox"
            id="terms-checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              setError('');
            }}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              marginTop: '2px',
              accentColor: Colors.primaryBright,
            }}
          />
          <label
            htmlFor="terms-checkbox"
            style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '20px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            I agree to the{' '}
            <span
              onClick={(e) => {
                e.preventDefault();
                setShowTerms(true);
              }}
              style={{
                color: Colors.primaryBright,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Terms and Conditions
            </span>
          </label>
        </div>

        {error && (
          <p style={{ color: '#ff4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isLoading || !agreedToTerms}
          style={{
            width: '100%',
            borderRadius: '8px',
            border: 'none',
            background: agreedToTerms 
              ? `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`
              : '#cccccc',
            padding: '14px',
            cursor: (isLoading || !agreedToTerms) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !agreedToTerms) ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
            {isLoading ? 'Sending...' : 'Get OTP'}
          </span>
        </button>

        <p
          style={{
            fontSize: '13px',
            color: '#999',
            textAlign: 'center',
            marginTop: '24px',
            lineHeight: '18px',
          }}
        >
          We'll send you a verification code to confirm your email
        </p>
      </div>

      {/* Verification Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
          onClick={handleModalClose}
        >
          <div
            style={{
              backgroundColor: Colors.inputBackground,
              borderRadius: '24px',
              padding: '30px',
              width: '100%',
              maxWidth: '340px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '35px',
                background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 20px',
              }}
            >
              <span style={{ fontSize: '40px', color: Colors.buttonText, fontWeight: 'bold' }}>
                ✓
              </span>
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: Colors.primaryDark,
                marginBottom: '16px',
              }}
            >
              Verification Code Sent!
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: Colors.subtitleGray,
                marginBottom: '12px',
                lineHeight: '20px',
              }}
            >
              We've sent a 6-digit verification code to:
            </p>

            <p
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: Colors.titleText,
                marginBottom: '16px',
              }}
            >
              {email}
            </p>

            <p
              style={{
                fontSize: '13px',
                color: Colors.subtitleGray,
                marginBottom: '24px',
                lineHeight: '18px',
              }}
            >
              Please check your inbox and enter the code on the next screen.
            </p>

            <button
              onClick={handleModalClose}
              style={{
                width: '100%',
                borderRadius: '25px',
                border: 'none',
                background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
                paddingTop: '14px',
                paddingBottom: '14px',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: Colors.buttonText, fontSize: '16px', fontWeight: '600' }}>
                OK
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailInputScreen;
