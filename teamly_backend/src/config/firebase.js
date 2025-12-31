const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'teamly-503a7',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'teamly-503a7.firebasestorage.app'
});

console.log('✅ Firebase Admin initialized successfully');
console.log(`📦 Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET || 'teamly-503a7.firebasestorage.app'}`);

module.exports = admin;
