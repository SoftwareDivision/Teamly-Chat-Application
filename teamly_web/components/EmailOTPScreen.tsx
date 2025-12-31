'use client';

// Email OTP Verification Screen View - Web version
import React, { useState, useRef, useEffect } from 'react';
import { Colors, EmailVerificationController, AuthService } from 'teamly_shared';

interface EmailOTPScreenProps {
  email: string;
  onVerified: (isProfileComplete: boolean) => void;
  onWrongEmail: () => void;
}

const EmailOTPScreen: React.FC<EmailOTPScreenProps> = ({
  email,
  onVerified,
  onWrongEmail,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    
    // Get pasted text
    const pastedData = e.clipboardData.getData('text');
    
    // Extract only digits
    const digits = pastedData.replace(/\D/g, '');
    
    if (digits.length === 0) return;
    
    // Fill OTP boxes with pasted digits
    const newOtp = [...otp];
    for (let i = 0; i < 6 && i < digits.length; i++) {
      newOtp[i] = digits[i];
    }
    setOtp(newOtp);
    
    // Focus on the last filled box or the next empty one
    const lastFilledIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
    
    // Auto-verify if all 6 digits are filled
    if (digits.length >= 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    
    if (!EmailVerificationController.validateOTP(otpCode, 6)) {
      setErrorMessage('Please enter a valid 6-digit code');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmailVerificationController.verifyCode(otpCode, email);
      if (result.success) {
        // Store tokens securely using AuthService
        await AuthService.saveToken(result.token!);
        if (result.refreshToken) {
          await AuthService.saveRefreshToken(result.refreshToken);
        }
        await AuthService.saveEmail(email);
        
        // Store user data if available
        if (result.user) {
          await AuthService.saveUserData(result.user);
          setIsProfileComplete(result.user.isProfileComplete || false);
          console.log('✅ Login successful! Tokens and user data stored securely');
          console.log('📋 Profile complete:', result.user.isProfileComplete);
        }
        
        setShowSuccessModal(true);
      } else {
        setErrorMessage('The code you entered is incorrect. Please try again.');
        setShowErrorModal(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const success = await EmailVerificationController.sendVerificationCode(email);
      if (success) {
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setErrorMessage('Failed to resend code. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f7f7f7',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Card - Matching Login Screen Style */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '440px',
          boxSizing: 'border-box',
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
          Verify your email
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#666',
            textAlign: 'center',
            lineHeight: '22px',
            marginBottom: '8px',
          }}
        >
          We sent a code to<br />
          <strong style={{ color: '#333' }}>{email}</strong>
        </p>

        <p
          style={{
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <span
            onClick={onWrongEmail}
            style={{ color: Colors.primaryBright, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Wrong email?
          </span>
        </p>

        {/* OTP Input Boxes */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(4px, 1.5vw, 12px)',
            marginBottom: '24px',
          }}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleOTPChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={(e) => handlePaste(e, index)}
              maxLength={1}
              autoFocus={index === 0}
              style={{
                width: 'clamp(36px, 10vw, 52px)',
                height: 'clamp(44px, 12vw, 56px)',
                borderRadius: '8px',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                fontSize: 'clamp(18px, 5vw, 24px)',
                fontWeight: '600',
                color: '#333',
                textAlign: 'center',
                outline: 'none',
                transition: 'border-color 0.2s',
                flexShrink: 0,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = Colors.primaryBright}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          ))}
        </div>

        {/* Resend Code Link */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Didn't receive the code?{' '}
          </span>
          <span
            onClick={handleResend}
            style={{
              fontSize: '14px',
              color: canResend ? Colors.primaryBright : '#999',
              fontWeight: '500',
              cursor: canResend && !isLoading ? 'pointer' : 'not-allowed',
              textDecoration: canResend ? 'underline' : 'none',
            }}
          >
            {canResend ? 'Resend' : `Resend code in ${resendTimer}s`}
          </span>
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={isLoading || otp.some(digit => digit === '')}
          style={{
            width: '100%',
            borderRadius: '8px',
            border: 'none',
            background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
            padding: '14px',
            cursor: isLoading || otp.some(digit => digit === '') ? 'not-allowed' : 'pointer',
            opacity: isLoading || otp.some(digit => digit === '') ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </span>
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
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
          onClick={() => {
            setShowSuccessModal(false);
            onVerified(isProfileComplete);
          }}
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
                width: '80px',
                height: '80px',
                borderRadius: '40px',
                background: `linear-gradient(to right, ${Colors.gradientStart}, ${Colors.gradientEnd})`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 20px',
              }}
            >
              <span style={{ fontSize: '50px', color: Colors.buttonText, fontWeight: 'bold' }}>
                ✓
              </span>
            </div>

            <h2
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: Colors.primaryDark,
                marginBottom: '16px',
              }}
            >
              Email Verified!
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: Colors.subtitleGray,
                marginBottom: '28px',
                lineHeight: '22px',
              }}
            >
              Your email has been successfully verified.<br />
              Welcome to Teamly!
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                onVerified(isProfileComplete);
              }}
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
                Continue
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
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
          onClick={() => setShowErrorModal(false)}
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
                width: '80px',
                height: '80px',
                borderRadius: '40px',
                backgroundColor: '#FFE5E5',
                border: '3px solid #FF4444',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 20px',
              }}
            >
              <span style={{ fontSize: '45px', color: '#FF4444', fontWeight: 'bold' }}>
                ✕
              </span>
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: Colors.titleText,
                marginBottom: '16px',
              }}
            >
              Invalid Code
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: Colors.subtitleGray,
                marginBottom: '28px',
                lineHeight: '22px',
              }}
            >
              {errorMessage}
            </p>

            <button
              onClick={() => setShowErrorModal(false)}
              style={{
                width: '100%',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: Colors.primaryDark,
                paddingTop: '14px',
                paddingBottom: '14px',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: Colors.buttonText, fontSize: '16px', fontWeight: '600' }}>
                Try Again
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailOTPScreen;
