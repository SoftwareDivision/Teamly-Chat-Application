import { useState } from 'react';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { ProfileController, AuthService } from 'teamly_shared';

export const useProfileSetupViewModel = (onProfileComplete: () => void) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNameChange = (text: string) => {
    setName(text);
  };

  const handlePhoneChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        includeBase64: true,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          setProfilePhoto(base64Image);
          console.log('Image selected, base64 length:', asset.base64.length);
        } else if (asset.uri) {
          setProfilePhoto(asset.uri);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate name
    const nameValidation = ProfileController.validateName(name);
    if (!nameValidation.isValid) {
      setErrorMessage(nameValidation.errorMessage || 'Invalid name');
      setShowErrorModal(true);
      return;
    }

    // Validate phone
    const phoneValidation = ProfileController.validatePhone(phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.errorMessage || 'Invalid phone number');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setErrorMessage('Session expired. Please login again.');
        setShowErrorModal(true);
        return;
      }

      const result = await ProfileController.updateProfile(token, { name, phone, profilePhoto });
      if (result.success) {
        // Update stored user data
        await AuthService.saveUserData(result.user);
        setShowSuccessModal(true);
      } else {
        setErrorMessage(result.message || 'Failed to update profile');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Failed to update profile. Please check your connection.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onProfileComplete();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  return {
    name,
    phone,
    profilePhoto,
    isLoading,
    showSuccessModal,
    showErrorModal,
    errorMessage,
    handleNameChange,
    handlePhoneChange,
    handlePickImage,
    handleSubmit,
    handleSuccessClose,
    handleErrorClose,
  };
};
