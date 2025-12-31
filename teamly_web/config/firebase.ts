// Firebase Configuration for Web Push Notifications
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBz4hjaPNJ1M57JnEL6Eb_7bWB5bq6oBIU",
  authDomain: "teamly-503a7.firebaseapp.com",
  projectId: "teamly-503a7",
  storageBucket: "teamly-503a7.firebasestorage.app",
  messagingSenderId: "641232976666",
  appId: "1:641232976666:web:57dde74d95ba28ce8f0aa3",
  measurementId: "G-CFTF8JEHZP"
};

// VAPID Key for Web Push
const VAPID_KEY = "BP8DKOcejtz-DvyoML_DkyM6GTVM_27PMiSyW5TG818BGD8rB1rA8tujDWlmknX9qLzmi1qyn7b_fg4-kSiXmIE";

let messaging: Messaging | null = null;

// Initialize Firebase
export const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    return null; // Don't initialize on server-side
  }

  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      const app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
      console.log('🔥 Firebase initialized for web push notifications');
    } else {
      messaging = getMessaging();
    }
    return messaging;
  } catch (error: any) {
    // Gracefully handle unsupported browser
    if (error?.code === 'messaging/unsupported-browser') {
      console.log('ℹ️ Firebase Cloud Messaging not supported - notifications will work via Socket.IO');
    } else {
      console.log('ℹ️ Firebase unavailable:', error?.message || error);
    }
    return null;
  }
};

// Get FCM token for this browser
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      messaging = initializeFirebase();
    }

    if (!messaging) {
      return null;
    }

    // Request notification permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('🔕 Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      console.log('🔑 FCM Token obtained:', token);
      return token;
    } else {
      console.log('⚠️ No FCM token available');
      return null;
    }
  } catch (error: any) {
    if (error?.code !== 'messaging/unsupported-browser') {
      console.log('ℹ️ Could not get FCM token:', error?.message || error);
    }
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) {
    messaging = initializeFirebase();
  }

  if (messaging) {
    return onMessage(messaging, (payload) => {
      console.log('📨 Foreground message received:', payload);
      callback(payload);
    });
  }
};

export { messaging };
