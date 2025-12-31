// ViewModel for Email OTP Verification Screen
import { useState, useRef, useEffect } from 'react';
import { TextInput } from 'react-native';
import { EmailVerificationController, AuthService } from 'teamly_shared';

export const useEmailOTPViewModel = (
  email: string, 
  onVerified: (isProfileComplete: boolean) => void
) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(false);

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
      console.log('🔍 Verify result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        // Store tokens securely using AuthService
        await AuthService.saveToken(result.token!);
        if (result.refreshToken) {
          await AuthService.saveRefreshToken(result.refreshToken);
        }
        await AuthService.saveEmail(email);
        
        // Store user data if available
        if (result.user) {
          console.log('👤 User data received:', JSON.stringify(result.user, null, 2));
          await AuthService.saveUserData(result.user);
          const profileComplete = result.user.isProfileComplete || false;
          setIsProfileComplete(profileComplete);
          console.log('✅ Login successful! Tokens and user data stored securely');
          console.log('📋 Profile complete:', profileComplete);
          console.log('📋 User name:', result.user.name);
          console.log('📋 User phone:', result.user.phone);
        }
        
        setShowSuccessModal(true);
      } else {
        setErrorMessage('The code you entered is incorrect. Please try again.');
        setShowErrorModal(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ Verify error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onVerified(isProfileComplete);
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
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

  return {
    otp,
    isLoading,
    canResend,
    resendTimer,
    inputRefs,
    showSuccessModal,
    showErrorModal,
    errorMessage,
    handleOTPChange,
    handleKeyPress,
    handleVerify,
    handleResend,
    handleSuccessClose,
    handleErrorClose,
  };
};
