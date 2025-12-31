import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useProfileSetupViewModel } from '../viewmodels/ProfileSetupViewModel';
import { Colors } from 'teamly_shared';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

interface ProfileSetupScreenProps {
  onProfileComplete: () => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onProfileComplete }) => {
  const {
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
  } = useProfileSetupViewModel(onProfileComplete);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile info</Text>
          
          <Text style={styles.subtitle}>
            Please provide your name and an optional profile photo
          </Text>

          {/* Profile Photo */}
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handlePickImage}
            disabled={isLoading}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your name here"
              placeholderTextColor="#999"
              value={name}
              onChangeText={handleNameChange}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={handlePhoneChange}
              editable={!isLoading}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <SuccessModal visible={showSuccessModal} onClose={handleSuccessClose} />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        onClose={handleErrorClose}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E91E63',
    marginTop: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  photoContainer: {
    marginBottom: 40,
  },
  placeholderPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  inputContainer: {
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#E91E63',
    marginBottom: 24,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  nextButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;
