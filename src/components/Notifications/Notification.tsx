import { toast } from "sonner";
import sound from "@/assets/media/notification.mp3";
import './Notification.css';
import React, { useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useTranslation } from '@/i18n/TranslationContext';

// Предзагрузка звука
const notificationSound = new Audio(sound);
notificationSound.preload = "auto";

type NotificationOptions = {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
};

export const notify = {
  success: (message: string, options?: NotificationOptions) => {
    toast.success(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration,
    });
    playNotificationSound();
  },
  
  error: (message: string, options?: NotificationOptions) => {
    toast.error(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration,
    });
    playNotificationSound();
  },
  
  info: (message: string, options?: NotificationOptions) => {
    toast(message, {
      action: options?.action,
      duration: options?.duration,
    });
    playNotificationSound();
  },
  
  // Можно добавить другие типы (warning, custom и т.д.)
};

function playNotificationSound() {
  notificationSound.currentTime = 0;
  notificationSound.play().catch(e => console.error("Ошибка воспроизведения:", e));
}

interface Reminder {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  reminderDate: Date | null;
  repeat: boolean;
  repeatInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notificationShown?: boolean;
}

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const { t } = useTranslation();

  // Подписка на напоминания пользователя
  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const remindersRef = collection(db, 'reminders', userId, 'userReminders');
    const q = query(remindersRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const remindersData: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        remindersData.push({
          id: doc.id,
          title: data.title || '',
          text: data.text || '',
          completed: data.completed || false,
          reminderDate: data.reminderDate?.toDate() || null,
          repeat: data.repeat || false,
          repeatInterval: data.repeatInterval || 'daily',
          notificationShown: data.notificationShown || false,
        });
      });
      setReminders(remindersData);
    });

    return () => unsubscribe();
  }, []);

  // Проверка времени напоминаний
  useEffect(() => {
    if (!auth.currentUser) return;

    const interval = setInterval(() => {
      reminders.forEach(async (reminder) => {
        if (
          reminder.reminderDate &&
          !reminder.completed &&
          !reminder.notificationShown &&
          new Date() >= reminder.reminderDate
        ) {
          notify.info(reminder.title, {
            description: reminder.reminderDate.toLocaleString(),
            action: {
              label: t('reminders.close'),
              onClick: () => {},
            },
          });

          const userId = auth.currentUser!.uid;
          const reminderRef = doc(db, 'reminders', userId, 'userReminders', reminder.id);

          if (reminder.repeat) {
            const nextDate = new Date(reminder.reminderDate);
            switch (reminder.repeatInterval) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
              case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
              default:
                break;
            }
            await updateDoc(reminderRef, {
              reminderDate: Timestamp.fromDate(nextDate),
              notificationShown: false,
            });
          } else {
            await updateDoc(reminderRef, {
              notificationShown: true,
              completed: true,
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reminders, t]);

  return <>{children}</>;
};

export default NotificationProvider;