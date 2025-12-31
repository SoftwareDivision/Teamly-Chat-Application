// Email OTP Verification Screen View
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
import { useEmailOTPViewModel } from '../viewmodels/EmailOTPViewModel';
import { Colors } from 'teamly_shared';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

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
  const {
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
  } = useEmailOTPViewModel(email, onVerified);

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
          <Text style={styles.title}>Verifying your email</Text>

          <Text style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            {email}{'\n'}
            Please check your inbox.{' '}
            <Text style={styles.link} onPress={onWrongEmail}>
              Wrong email?
            </Text>
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit: string, index: number) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.otpBox}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Resend Code Link */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend || isLoading}
            style={styles.resendContainer}
          >
            <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
              {canResend ? "Didn't receive code?" : `Resend code in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Next Button at bottom */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={() => handleVerify()}
            disabled={isLoading || otp.some((digit: string) => digit === '')}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.buttonText} />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Success Modal */}
        <SuccessModal visible={showSuccessModal} onClose={handleSuccessClose} />

        {/* Error Modal */}
        <ErrorModal
          visible={showErrorModal}
          title="Invalid Code"
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
    marginBottom: 40,
  },
  link: {
    color: Colors.linkText,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 45,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.titleText,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 14,
    color: Colors.linkText,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: Colors.subtitleGray,
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
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EmailOTPScreen;
