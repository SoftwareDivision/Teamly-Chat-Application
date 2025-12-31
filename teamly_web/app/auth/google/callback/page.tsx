'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoogleDriveCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('🔄 Callback page loaded');
    console.log('📝 Code:', code ? 'Present' : 'Missing');
    console.log('❌ Error:', error || 'None');
    console.log('👨‍👦 Has opener:', !!window.opener);

    if (code) {
      // Store code in localStorage for parent window to read
      localStorage.setItem('google_drive_auth_code', code);
      localStorage.setItem('google_drive_auth_status', 'success');
      console.log('💾 Stored code in localStorage');
      
      // Also try postMessage as backup
      if (window.opener) {
        console.log('📤 Sending message to parent window...');
        window.opener.postMessage(
          {
            type: 'GOOGLE_DRIVE_AUTH_SUCCESS',
            code: code,
          },
          window.location.origin
        );
        console.log('✅ Message sent!');
      } else {
        console.error('❌ No window.opener found!');
      }
      
      // Close window after delay
      setTimeout(() => {
        console.log('🚪 Closing window...');
        window.close();
      }, 2000);
    } else if (error) {
      // Store error in localStorage
      localStorage.setItem('google_drive_auth_error', error);
      localStorage.setItem('google_drive_auth_status', 'error');
      
      // Also try postMessage as backup
      if (window.opener) {
        console.log('📤 Sending error to parent window...');
        window.opener.postMessage(
          {
            type: 'GOOGLE_DRIVE_AUTH_ERROR',
            error: error,
          },
          window.location.origin
        );
      }
      
      // Close window after delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      console.warn('⚠️ No code or error in URL');
    }
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#F5F5F5',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          border: '3px solid #4285F4',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <h2 style={{ margin: '0 0 8px 0', color: '#212121' }}>
          {searchParams.get('code') ? 'Authorization Successful!' : 'Connecting Google Drive...'}
        </h2>
        <p style={{ margin: 0, color: '#757575', fontSize: '14px' }}>
          {searchParams.get('code') ? 'Completing setup...' : 'This window will close automatically'}
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function GoogleDriveCallback() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#F5F5F5',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            border: '3px solid #4285F4',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <h2 style={{ margin: '0 0 8px 0', color: '#212121' }}>Loading...</h2>
        </div>
      </div>
    }>
      <GoogleDriveCallbackContent />
    </Suspense>
  );
}
