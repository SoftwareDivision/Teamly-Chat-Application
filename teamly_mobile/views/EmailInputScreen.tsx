// Email Input Screen View
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useEmailInputViewModel } from '../viewmodels/EmailInputViewModel';
import { Colors } from 'teamly_shared';
import VerificationModal from '../components/VerificationModal';
import ErrorModal from '../components/ErrorModal';
import TermsAndConditionsScreen from './TermsAndConditionsScreen';

interface EmailInputScreenProps {
  onEmailSubmitted: (email: string) => void;
}

const EmailInputScreen: React.FC<EmailInputScreenProps> = ({ onEmailSubmitted }) => {
  const { 
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
  } = useEmailInputViewModel(onEmailSubmitted);

  // Show Terms and Conditions screen
  if (showTerms) {
    return <TermsAndConditionsScreen onBack={closeTerms} />;
  }

  return (
    <LinearGradient
      colors={[Colors.backgroundGradientTop, Colors.backgroundGradientBottom]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Enter your email</Text>
          
          <Text style={styles.subtitle}>
            Teamly will send a verification code to{'\n'}
            your email address to verify your account.
          </Text>
          
          <View style={styles.spacer} />

          {/* Email Input */}
          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.emailInput}
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Email address"
              placeholderTextColor={Colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          {/* Terms and Conditions Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              onPress={toggleTerms}
              style={styles.checkboxContainer}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Icon name="checkmark" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text 
                style={styles.termsLink}
                onPress={openTerms}
              >
                Terms and Conditions
              </Text>
            </Text>
          </View>
        </View>

        {/* Next Button at bottom */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.nextButton, (isLoading || !agreedToTerms) && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isLoading || !agreedToTerms}
          >
            {agreedToTerms ? (
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.buttonText} />
                ) : (
                  <Text style={styles.nextButtonText}>Get OTP</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.nextButtonGradient, styles.nextButtonDisabledGradient]}>
                <Text style={styles.nextButtonText}>Get OTP</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Verification Modal */}
        <VerificationModal
          visible={showModal}
          email={email}
          onClose={handleModalClose}
        />

        {/* Error Modal */}
        <ErrorModal
          visible={showErrorModal}
          title="Error"
          message={errorMessage}
          onClose={handleErrorClose}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subtitleGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  spacer: {
    height: 54,
  },
  emailInputContainer: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryBright,
  },
  emailInput: {
    fontSize: 16,
    color: Colors.titleText,
    paddingVertical: 12,
  },
  bottomContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  nextButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabledGradient: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  checkboxContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.primaryBright,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryBright,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primaryBright,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default EmailInputScreen;
