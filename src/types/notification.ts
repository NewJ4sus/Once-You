export interface Notification {
  id: string;
  title: string;
  text: string;
  timestamp: number;
}

export interface NotificationContextType {
  showNotification: (params: Omit<Notification, 'id' | 'timestamp'>) => void;
  hideNotification: (id: string) => void;
  notifications: Notification[];
} 