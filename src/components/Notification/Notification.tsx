import React, { useEffect, useState } from 'react';
import { NotificationType } from '@/types/notification';

interface NotificationProps {
  type?: NotificationType;
  title: string;
  text: string;
  duration?: number;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  type = 'default',
  title,
  text,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'medium':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'high':
        return 'bg-red-100 border-red-400 text-red-800';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 border-l-4 p-4 rounded shadow-lg max-w-xs ${getTypeStyles()}`}
      role="alert"
    >
      <h3 className="font-bold">{title}</h3>
      <p>{text}</p>
    </div>
  );
};