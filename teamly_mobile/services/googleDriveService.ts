// Google Drive Service for Mobile (React Native)
import { Alert, Linking } from 'react-native';
import { ApiService, AuthService } from 'teamly_shared';

export class GoogleDriveService {
  // Open Google Drive OAuth in browser
  static async connectDrive(): Promise<boolean> {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        return false;
      }

      // Get OAuth URL from backend
      console.log('📡 Requesting OAuth URL from backend...');
      const response = await ApiService.getGoogleDriveAuthUrl(token);
      
      console.log('📥 Backend response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.authUrl) {
        const authUrl = response.authUrl.trim();
        console.log('🔗 Opening Drive OAuth URL:', authUrl);
        console.log('🔗 URL length:', authUrl.length);
        console.log('🔗 URL starts with:', authUrl.substring(0, 50));
        
        // Validate URL format
        if (!authUrl.startsWith('http://') && !authUrl.startsWith('https://')) {
          throw new Error('Invalid URL format');
        }
        
        try {
          // Check if URL can be opened
          const canOpen = await Linking.canOpenURL(authUrl);
          console.log('✅ Can open URL:', canOpen);
          
          if (!canOpen) {
            throw new Error('URL cannot be opened');
          }
          
          // Try to open URL directly
          await Linking.openURL(authUrl);
          console.log('✅ URL opened successfully');
          
          // Show instructions
          Alert.alert(
            'Complete Authorization',
            'After authorizing in your browser, return to the app and tap the attachment icon again to upload files.',
            [{ text: 'Got it' }]
          );
          
          return true;
        } catch (linkError: any) {
          console.error('❌ Linking error:', linkError);
          console.error('❌ Error message:', linkError.message);
          
          // Fallback: Suggest using web app
          Alert.alert(
            'Connection Issue',
            'Unable to open browser. Please connect Google Drive using the web app first, then return to mobile.',
            [{ text: 'OK' }]
          );
          
          return false;
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to get authorization URL');
        return false;
      }
    } catch (error: any) {
      console.error('Connect Drive error:', error);
      Alert.alert('Error', error.message || 'Failed to connect Google Drive');
      return false;
    }
  }

  // Check if Drive is connected
  static async checkConnection(): Promise<boolean> {
    try {
      const token = await AuthService.getToken();
      if (!token) return false;

      const response = await ApiService.checkGoogleDriveStatus(token);
      return response.driveConnected || false;
    } catch (error) {
      console.error('Check Drive connection error:', error);
      return false;
    }
  }

  // Upload file to Google Drive (using React Native file picker)
  static async uploadFile(fileUri: string, fileName: string, mimeType: string): Promise<any> {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get Drive access token
      const tokenResponse = await ApiService.getGoogleDriveToken(token);
      if (!tokenResponse.success) {
        throw new Error('Failed to get Drive token');
      }

      const driveAccessToken = tokenResponse.accessToken;

      // Read file as base64
      const RNFS = require('react-native-fs');
      const fileContent = await RNFS.readFile(fileUri, 'base64');
      const fileSize = (await RNFS.stat(fileUri)).size;

      // Upload to Google Drive
      const metadata = {
        name: fileName,
        mimeType: mimeType,
      };

      const form = new FormData();
      form.append('metadata', {
        string: JSON.stringify(metadata),
        type: 'application/json',
      });
      form.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      });

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${driveAccessToken}`,
          },
          body: form,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to Drive');
      }

      const uploadData = await uploadResponse.json();
      const fileId = uploadData.id;

      // Make file public
      await this.makeFilePublic(fileId, driveAccessToken);

      // Get shareable link
      const driveLink = this.getShareableLink(fileId);
      const fileType = this.getFileType(mimeType);

      return {
        fileId,
        fileName,
        mimeType,
        fileSize,
        driveLink,
        fileType,
      };
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  // Make file public
  static async makeFilePublic(fileId: string, accessToken: string): Promise<void> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to make file public');
      }
    } catch (error) {
      console.error('Make file public error:', error);
      throw error;
    }
  }

  // Get shareable link
  static getShareableLink(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // Get file type from MIME type
  static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    return 'file';
  }

  // Download file from Google Drive
  static async downloadFile(driveUrl: string): Promise<void> {
    try {
      const RNFS = require('react-native-fs');
      const { PermissionsAndroid, Platform } = require('react-native');

      // Request storage permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to download files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to download files');
          return;
        }
      }

      // Extract file ID from Drive URL
      const fileIdMatch = driveUrl.match(/[?&]id=([^&]+)/);
      if (!fileIdMatch) {
        Alert.alert('Error', 'Invalid Google Drive link');
        return;
      }
      const fileId = fileIdMatch[1];

      // Generate filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `drive_file_${timestamp}`;
      
      // Determine download path
      const downloadPath = Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      Alert.alert('Downloading', 'File download started...');

      // Download file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: driveUrl,
        toFile: downloadPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          'Download Complete',
          `File saved to ${Platform.OS === 'ios' ? 'Documents' : 'Downloads'} folder`,
          [
            {
              text: 'OK',
              onPress: () => {
                // On iOS, show share sheet
                if (Platform.OS === 'ios') {
                  const Share = require('react-native').Share;
                  Share.share({
                    url: `file://${downloadPath}`,
                  });
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to download file');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to download file');
    }
  }

  // Check if URL is a Google Drive link
  static isDriveLink(url: string): boolean {
    return url.includes('drive.google.com') && url.includes('id=');
  }
}
