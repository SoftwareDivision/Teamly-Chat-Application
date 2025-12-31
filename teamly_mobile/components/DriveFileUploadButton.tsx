import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { ApiService, AuthService } from 'teamly_shared';
import { launchImageLibrary } from 'react-native-image-picker';
import { GoogleDriveService } from '../services/googleDriveService';
import { ConnectDriveModal } from './ConnectDriveModal';
import Icon from 'react-native-vector-icons/Ionicons';

interface DriveFileUploadButtonProps {
  onUploadSuccess: (fileData: {
    driveLink: string;
    driveFileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) => void;
  onUploadError?: (error: string) => void;
}

export const DriveFileUploadButton: React.FC<DriveFileUploadButtonProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkDriveStatus();
  }, []);

  const checkDriveStatus = async () => {
    try {
      const connected = await GoogleDriveService.checkConnection();
      setIsDriveConnected(connected);
    } catch (error) {
      console.error('Check Drive status error:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await GoogleDriveService.connectDrive();
      if (success) {
        setShowConnectModal(false);
        // Recheck status after a delay (user needs to complete OAuth)
        setTimeout(() => {
          checkDriveStatus();
        }, 2000);
      }
    } catch (error) {
      console.error('Connect error:', error);
      Alert.alert('Error', 'Failed to connect Google Drive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleButtonPress = async () => {
    if (!isDriveConnected) {
      setShowConnectModal(true);
      return;
    }

    // Pick file using image picker (supports all media types)
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
      });

      if (result.didCancel) {
        console.log('User cancelled file picker');
        return;
      }

      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Failed to pick file');
      }

      const file = result.assets?.[0];
      if (!file || !file.uri) return;

      console.log('📎 Selected file:', file);

      // Upload to Drive
      setIsUploading(true);
      setUploadProgress(10);

      const fileName = file.fileName || `file_${Date.now()}`;
      const mimeType = file.type || 'application/octet-stream';

      const fileData = await GoogleDriveService.uploadFile(
        file.uri,
        fileName,
        mimeType
      );

      setUploadProgress(100);

      // Call success callback
      onUploadSuccess({
        driveLink: fileData.driveLink,
        driveFileId: fileData.fileId,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
      });

      Alert.alert('Success', `File uploaded: ${fileData.fileName}`);
    } catch (error: any) {
      console.error('File upload error:', error);
      const errorMessage = error.message || 'Failed to upload file';
      onUploadError?.(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isCheckingStatus) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#E91E63" />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={handleButtonPress}
        disabled={isUploading}
        style={styles.button}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#8696A0" />
        ) : (
          <View style={styles.iconContainer}>
            <Icon 
              name="attach" 
              size={22} 
              color={isDriveConnected ? '#54656F' : '#8696A0'}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
            {!isDriveConnected && !isUploading && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <ConnectDriveModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnect}
        isConnecting={isConnecting}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    position: 'relative',
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9800',
  },
});
