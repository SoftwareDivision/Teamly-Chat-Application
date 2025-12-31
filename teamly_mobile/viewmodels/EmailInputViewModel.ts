// ViewModel for Email Input Screen
import { useState } from 'react';
import { EmailVerificationController } from 'teamly_shared';

export const useEmailInputViewModel = (onEmailSubmitted: (email: string) => void) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
  };

  const handleNext = async () => {
    // Check if terms are agreed
    if (!agreedToTerms) {
      setErrorMessage('Please agree to the Terms and Conditions to continue');
      setShowErrorModal(true);
      return;
    }

    // Validate email with detailed error messages
    const validation = EmailVerificationController.validateEmailWithMessage(email);
    
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'Please enter a valid email address');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const success = await EmailVerificationController.sendVerificationCode(email);
      if (success) {
        setShowModal(true);
      }
    } catch (error) {
      setErrorMessage('Failed to send verification code. Please check your connection and try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    onEmailSubmitted(email);
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  const toggleTerms = () => {
    setAgreedToTerms(!agreedToTerms);
  };

  const openTerms = () => {
    setShowTerms(true);
  };

  const closeTerms = () => {
    setShowTerms(false);
  };

  return {
    email,
    isLoading,
    showModal,
    showErrorModal,
    errorMessage,
    agreedToTerms,
    showTerms,
    handleEmailChange,
    handleNext,
    handleModalClose,
    handleErrorClose,
    toggleTerms,
    openTerms,
    closeTerms,
  };
};
