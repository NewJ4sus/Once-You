import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import SVG from '../../../components/SVG/SVG';

// Обновленные интерфейсы
interface Weekdays {
  en: string[];
  ru: string[];
}

interface Months {
  en: string[];
  ru: string[];
}

interface Task {
  id: string;
  createdAt: Date;
  title: string;
  completed: boolean;
}

interface Reminder {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  reminderDate: Date | null;
  repeat: boolean;
  repeatInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface DayEvents {
  hasTasks: boolean;
  hasReminders: boolean;
  tasks: Task[];
  reminders: Reminder[];
}

const weekdays: Weekdays = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
};

const months: Months = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
};

const CalendarContent: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [remindersCount, setRemindersCount] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch tasks and reminders from Firebase
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    
    // Query for tasks
    const tasksRef = collection(db, 'tasks', userId, 'userTasks');
    const tasksQuery = query(tasksRef);
    
    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const tasksData: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {
          tasksData.push({
            id: doc.id,
            title: data.title || '',
            completed: data.completed || false,
            createdAt: data.createdAt.toDate()
          });
        }
      });
      setTasks(tasksData);
    });
    
    // Query for reminders
    const remindersRef = collection(db, 'reminders', userId, 'userReminders');
    const remindersQuery = query(remindersRef);
    
    const unsubscribeReminders = onSnapshot(remindersQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const remindersData: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Преобразуем дату напоминания, если она существует
        let reminderDate = null;
        if (data.reminderDate) {
          try {
            reminderDate = data.reminderDate.toDate();
          } catch (error) {
            console.error('Error converting reminderDate:', error);
          }
        }

        remindersData.push({
          id: doc.id,
          title: data.title || '',
          text: data.text || '',
          completed: data.completed || false,
          reminderDate: reminderDate,
          repeat: data.repeat || false,
          repeatInterval: data.repeatInterval || 'daily'
        });
      });

      setReminders(remindersData);
      setLoading(false);
    });
    
    return () => {
      unsubscribeTasks();
      unsubscribeReminders();
    };
  }, [currentDate]);

  // Вспомогательные функции для работы с календарем
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  // Функция для проверки событий дня
  const getDayEvents = (date: Date): DayEvents => {
    const dayTasks = tasks.filter(task => {
      if (!task.createdAt) return false;
      return (
        task.createdAt.getDate() === date.getDate() &&
        task.createdAt.getMonth() === date.getMonth() &&
        task.createdAt.getFullYear() === date.getFullYear()
      );
    });

    const dayReminders = reminders.filter(reminder => {
      if (!reminder.reminderDate) return false;
      return (
        reminder.reminderDate.getDate() === date.getDate() &&
        reminder.reminderDate.getMonth() === date.getMonth() &&
        reminder.reminderDate.getFullYear() === date.getFullYear()
      );
    });

    return {
      hasTasks: dayTasks.length > 0,
      hasReminders: dayReminders.length > 0,
      tasks: dayTasks,
      reminders: dayReminders
    };
  };

  // Подсчет количества задач и напоминаний для текущего месяца
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthTasks = tasks.filter(task => {
      if (!task.createdAt) return false;
      return (
        task.createdAt.getMonth() === month &&
        task.createdAt.getFullYear() === year
      );
    });

    const monthReminders = reminders.filter(reminder => {
      if (!reminder.reminderDate) return false;
      return (
        reminder.reminderDate.getMonth() === month &&
        reminder.reminderDate.getFullYear() === year
      );
    });

    setTasksCount(monthTasks.length);
    setRemindersCount(monthReminders.length);
  }, [currentDate, tasks, reminders]);

  // Навигация по календарю
  const navigateMonth = (direction: number): void => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const navigateYear = (direction: number): void => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(newDate.getFullYear() + direction);
      return newDate;
    });
  };

  const goToToday = (): void => {
    setCurrentDate(new Date());
  };

  // Рендер дней календаря
  const renderCalendarDays = (): React.ReactElement[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const today = new Date();
    const days: React.ReactElement[] = [];

    // Добавляем дни предыдущего месяца
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDay = getDaysInMonth(year, month - 1) - firstDayOfMonth + i + 1;
      days.push(
        <div key={`prev-${i}`} className="calendar-day other-month">
          <div className="day-number">{prevMonthDay}</div>
        </div>
      );
    }

    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear();
      
      const dayEvents = getDayEvents(date);

      days.push(
        <div 
          key={`current-${day}`} 
          className={`calendar-day ${isToday ? 'today' : ''}`}
        >
          <div className="day-number">{day}</div>
          <div className="day-indicators">
            {dayEvents.tasks.length > 0 && renderIndicators(dayEvents.tasks.length, 'task')}
            {dayEvents.reminders.length > 0 && renderIndicators(dayEvents.reminders.length, 'reminder')}
          </div>
        </div>
      );
    }

    // Добавляем дни следующего месяца
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDayOfMonth + daysInMonth);
    
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div key={`next-${i}`} className="calendar-day other-month">
          <div className="day-number">{i}</div>
        </div>
      );
    }

    return days;
  };

  const renderIndicators = (count: number, type: 'task' | 'reminder') => {
    const maxIndicators = 4;
    const indicators = [];
    const actualCount = Math.min(count, maxIndicators);
    
    for (let i = 0; i < actualCount; i++) {
      indicators.push(
        <div 
          key={`${type}-${i}`} 
          className={`indicator ${type}`} 
          style={{
            opacity: 1 - (i * 0.2), // Уменьшаем прозрачность для каждого следующего индикатора
            marginLeft: i > 0 ? '-4px' : '0', // Накладываем индикаторы друг на друга
            zIndex: maxIndicators - i // Чтобы более непрозрачные были впереди
          }}
        />
      );
    }

    if (count > maxIndicators) {
      return (
        <div className="indicators-group">
          <div className="indicators-stack">
            {indicators}
          </div>
          <span className="indicators-count" title={`${count} ${type === 'task' ? 'задач' : 'напоминаний'}`}>
            {count}
          </span>
        </div>
      );
    }

    return <div className="indicators-stack">{indicators}</div>;
  };

  if (loading) {
    return <div className="loading">Loading calendar data...</div>;
  }

  return (
    <main>
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-controls">
            <div className="calendar-navigation">
              <button className="nav-button" onClick={() => navigateYear(-1)}>
                <SVG name="arrow_left" />
              </button>
              <span className="year">{currentDate.getFullYear()}</span>
              <button className="nav-button" onClick={() => navigateYear(1)}>
                <SVG name="arrow_right" />
              </button>
            </div>
            <div className="calendar-navigation">
              <button className="nav-button" onClick={() => navigateMonth(-1)}>
                <SVG name="arrow_left" />
              </button>
              <span className="month">{months.ru[currentDate.getMonth()]}</span>
              <button className="nav-button" onClick={() => navigateMonth(1)}>
                <SVG name="arrow_right" />
              </button>
            </div>
          </div>
          <div className="calendar-actions">
            <button className="today-button" onClick={goToToday}>Сегодня</button>
            <div className="calendar-stats">
              <div className="stat-item">
                <span className="stat-label">Задачи:</span>
                <span className="stat-value">{tasksCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Напоминания:</span>
                <span className="stat-value">{remindersCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="calendar-weekdays">
          {weekdays.ru.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>
      </div>
    </main>
  );
};

export default CalendarContent;