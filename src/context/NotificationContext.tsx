// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundManager } from '@/utils/sound';

type NotificationType = 'default' | 'medium' | 'high';

interface NotificationOptions {
  type?: NotificationType;
  sound?: boolean;
  title: string;
  text: string;
  onClick?: () => void;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  requestPermission: () => Promise<NotificationPermission>;
  permission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      return permissionResult;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const playNotificationSound = () => {
    soundManager.play().catch(e => console.error('Error playing notification sound:', e));
  };

  const showNotification = ({
    type = 'default',
    sound = true, // Default to true if userSettings not available
    title,
    text,
    onClick,
  }: NotificationOptions) => {
    // Check if browser supports notifications
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    // If permission is granted, show notification
    if (permission === 'granted') {
      const notification = new Notification(title, {
        body: text,
        icon: '/icons/notification-icon.png',
        requireInteraction: type === 'high',
      });

      if (sound) {
        playNotificationSound();
      }

      if (onClick) {
        notification.onclick = onClick;
      }
    }
    // If permission isn't denied, request it
    else if (permission !== 'denied') {
      requestPermission().then((perm) => {
        if (perm === 'granted') {
          showNotification({ type, sound, title, text, onClick });
        }
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, requestPermission, permission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};