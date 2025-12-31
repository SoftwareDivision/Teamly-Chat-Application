'use client';

import { useEffect } from 'react';
import { initializeWebStorage } from '@/storage/WebStorage';
import { NotificationService } from '../services/notificationService';

export function StorageInitializer() {
  useEffect(() => {
    // Initialize storage and notifications only in browser
    if (typeof window !== 'undefined') {
      initializeWebStorage();
      NotificationService.initialize();
    }
  }, []);

  return null; // This component doesn't render anything
}
