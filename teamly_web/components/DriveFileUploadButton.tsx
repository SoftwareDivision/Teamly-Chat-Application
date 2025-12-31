'use client';

import { useRef, useState, useEffect } from 'react';
import { ApiService, AuthService } from 'teamly_shared';
import { GoogleDriveService } from '../services/googleDriveService';
import ConnectDriveModal from './ConnectDriveModal';
import { IoAttach } from 'react-icons/io5';

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

export default function DriveFileUploadButton({ onUploadSuccess, onUploadError }: DriveFileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check Drive status on mount
  useEffect(() => {
    checkDriveStatus();
  }, []);

  const checkDriveStatus = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      const response = await ApiService.checkGoogleDriveStatus(token);
      setIsDriveConnected(response.driveConnected || false);
    } catch (error) {
      console.error('Check Drive status error:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleButtonClick = () => {
    if (!isDriveConnected) {
      setShowConnectModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      console.log('📤 Starting file upload:', file.name);
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get Drive access token
      setUploadProgress(20);
      const tokenResponse = await ApiService.getGoogleDriveToken(token);
      if (!tokenResponse.success) {
        throw new Error('Failed to get Drive token');
      }

      const driveAccessToken = tokenResponse.accessToken;

      // Upload to Drive
      setUploadProgress(40);
      const fileData = await GoogleDriveService.uploadFileToDrive(file, driveAccessToken);
      console.log('✅ File uploaded to Drive:', fileData);

      // Make file public
      setUploadProgress(70);
      await GoogleDriveService.makeFilePublic(fileData.fileId, driveAccessToken);
      console.log('✅ File is now public');

      // Get shareable link
      setUploadProgress(90);
      const driveLink = GoogleDriveService.getShareableLink(fileData.fileId);
      const fileType = GoogleDriveService.getFileType(fileData.mimeType);

      console.log('✅ Drive link:', driveLink);

      // Call success callback
      onUploadSuccess({
        driveLink,
        driveFileId: fileData.fileId,
        fileName: fileData.fileName,
        fileType,
        fileSize: fileData.fileSize,
      });

      setUploadProgress(100);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      onUploadError?.(errorMessage);
      alert('Failed to upload file: ' + errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDriveConnected = () => {
    setIsDriveConnected(true);
    setShowConnectModal(false);
  };

  if (isCheckingStatus) {
    return (
      <div style={{
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          width: '14px',
          height: '14px',
          border: '2px solid #E0E0E0',
          borderTopColor: '#E91E63',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        style={{ display: 'none' }}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      
      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        title={isDriveConnected ? 'Attach file' : 'Connect Google Drive first'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          padding: '4px',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          opacity: isUploading ? 0.5 : 1,
          position: 'relative',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isUploading) {
            e.currentTarget.style.background = '#F5F5F5';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {isUploading ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.4 31.4" strokeDashoffset="0">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        ) : (
          <IoAttach 
            size={22} 
            style={{ 
              color: isDriveConnected ? '#54656F' : '#8696A0',
              transform: 'rotate(45deg)'
            }} 
          />
        )}
      </button>

      <ConnectDriveModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={handleDriveConnected}
      />

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
