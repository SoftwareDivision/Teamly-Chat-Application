// Professional Verification Modal Component
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from 'teamly_shared';

interface VerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  visible,
  email,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.iconGradient}
            >
              <Text style={styles.iconText}>✓</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>Verification Code Sent!</Text>
          
          <Text style={styles.message}>
            We've sent a 6-digit verification code to:
          </Text>
          
          <Text style={styles.email}>{email}</Text>
          
          <Text style={styles.instruction}>
            Please check your inbox and enter the code on the next screen.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>OK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
    color: Colors.buttonText,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.subtitleGray,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.titleText,
    marginBottom: 16,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 13,
    color: Colors.subtitleGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  button: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerificationModal;
