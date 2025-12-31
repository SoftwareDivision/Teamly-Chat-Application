// Firebase Cloud Messaging Service Worker
// This runs in the background and handles push notifications when browser is closed

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration (same as in firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBz4hjaPNJ1M57JnEL6Eb_7bWB5bq6oBIU",
  authDomain: "teamly-503a7.firebaseapp.com",
  projectId: "teamly-503a7",
  storageBucket: "teamly-503a7.firebasestorage.app",
  messagingSenderId: "641232976666",
  appId: "1:641232976666:web:57dde74d95ba28ce8f0aa3"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/teamly-logo.png',
    badge: '/teamly-badge.png',
    tag: payload.data?.chatId || 'teamly-notification',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  // Open or focus the app
  const chatId = event.notification.data?.chatId;
  const urlToOpen = chatId 
    ? `${self.location.origin}/#chat-${chatId}`
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[Service Worker] Firebase messaging service worker loaded');
