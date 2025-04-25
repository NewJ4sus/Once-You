import { useEffect, useCallback } from 'react';
import { 
  collection, 
  query,
  getDocs,
  updateDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useNotify } from '@/hooks/useNotify';

interface Reminder {
  id: string;
  title: string;
  reminderDate: Date | null;
  repeat: boolean;
  repeatInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  completed: boolean;
  notificationShown?: boolean;
}

const ReminderNotificationHandler: React.FC = () => {
  const { notify } = useNotify();

  // Выносим логику проверки в отдельную функцию
  const checkReminders = useCallback(async () => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const remindersRef = collection(db, 'reminders', userId, 'userReminders');
    const q = query(remindersRef);
    
    // Получаем актуальные данные из Firebase
    const querySnapshot = await getDocs(q);
    const reminders: Reminder[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.reminderDate) { // Проверяем наличие даты
        reminders.push({
          id: doc.id,
          title: data.title,
          reminderDate: data.reminderDate.toDate(),
          repeat: data.repeat || false,
          repeatInterval: data.repeatInterval,
          completed: data.completed || false,
          notificationShown: data.notificationShown || false
        });
      }
    });

    // Проверяем каждое напоминание
    reminders.forEach(async (reminder) => {
      if (!reminder.completed && !reminder.notificationShown) {
        const now = new Date();
        let checkTime = new Date(reminder.reminderDate!);

        // Для повторяющихся напоминаний проверяем все пропущенные повторения
        if (reminder.repeat && reminder.repeatInterval) {
          while (checkTime < now) {
            const nextTime = new Date(checkTime);
            
            switch (reminder.repeatInterval) {
              case 'daily':
                nextTime.setDate(nextTime.getDate() + 1);
                break;
              case 'weekly':
                nextTime.setDate(nextTime.getDate() + 7);
                break;
              case 'monthly':
                nextTime.setMonth(nextTime.getMonth() + 1);
                break;
              case 'yearly':
                nextTime.setFullYear(nextTime.getFullYear() + 1);
                break;
            }

            if (nextTime > now) break;
            checkTime = nextTime;
          }
        }

        // Проверяем, находится ли время в пределах последней минуты
        if (checkTime <= now && checkTime >= new Date(now.getTime() - 60000)) {
          console.log('Sending notification for:', reminder.title); // Для отладки

          notify(
            'Напоминание', 
            reminder.title, 
            {
              sound: true,
              onClick: () => window.location.href = '/reminders',
            }
          );
          
          const reminderRef = doc(db, 'reminders', userId, 'userReminders', reminder.id);
          
          if (reminder.repeat) {
            // Для повторяющихся напоминаний устанавливаем следующее время
            const nextReminderDate = new Date(checkTime);
            switch (reminder.repeatInterval) {
              case 'daily':
                nextReminderDate.setDate(nextReminderDate.getDate() + 1);
                break;
              case 'weekly':
                nextReminderDate.setDate(nextReminderDate.getDate() + 7);
                break;
              case 'monthly':
                nextReminderDate.setMonth(nextReminderDate.getMonth() + 1);
                break;
              case 'yearly':
                nextReminderDate.setFullYear(nextReminderDate.getFullYear() + 1);
                break;
            }

            await updateDoc(reminderRef, {
              reminderDate: Timestamp.fromDate(nextReminderDate),
              notificationShown: false
            });
          } else {
            await updateDoc(reminderRef, {
              notificationShown: true
            });
          }
        }
      }
    });
  }, [notify]);

  useEffect(() => {
    // Проверяем сразу при монтировании
    checkReminders();

    // Устанавливаем интервал для периодической проверки
    const intervalId = setInterval(checkReminders, 10000);

    // Очищаем при размонтировании
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  return null;
};

export default ReminderNotificationHandler; 