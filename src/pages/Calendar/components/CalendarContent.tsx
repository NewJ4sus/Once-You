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
import { useTranslation } from '@/i18n/TranslationContext';
import Modal from '@/components/Modals/MediumModal/Modal';

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

const CalendarContent: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [remindersCount, setRemindersCount] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<DayEvents | null>(null);
  const { t } = useTranslation();

  const weekdays = [t('calendar.monday'), t('calendar.tuesday'), 
                  t('calendar.wednesday'), t('calendar.thursday'), 
                  t('calendar.friday'), t('calendar.saturday'), 
                  t('calendar.sunday')];
  const months = [t('calendar.january'), t('calendar.february'), 
                  t('calendar.march'), t('calendar.april'), 
                  t('calendar.may'), t('calendar.june'), 
                  t('calendar.july'), t('calendar.august'), 
                  t('calendar.september'), t('calendar.october'), 
                  t('calendar.november'), t('calendar.december')];

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

  // Function to handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const events = getDayEvents(date);
    setSelectedDayEvents(events);
    const modal = document.getElementById('DayDetailsModal');
    if (modal) {
      modal.classList.add('active');
    }
  };

  // Function to format date
  const formatDate = (date: Date): string => {
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
          onClick={() => handleDayClick(date)}
          style={{ cursor: 'pointer' }}
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
    return <main className="ml-600"><div className="no_note_content"><p>{t('calendar.loading')}</p></div></main>;
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
              <span className="month">{months[currentDate.getMonth()]}</span>
              <button className="nav-button" onClick={() => navigateMonth(1)}>
                <SVG name="arrow_right" />
              </button>
            </div>
          </div>
          <div className="calendar-actions">
            <button className="today-button" onClick={goToToday}>
              {t('calendar.dayBtn')}
            </button>
            <div className="calendar-stats">
              <div className="stat-item">
                <span className="stat-label">{t('calendar.task')}</span>
                <span className="stat-value">{tasksCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('calendar.reminder')}</span>
                <span className="stat-value">{remindersCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="calendar-weekdays">
          {weekdays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Day Details Modal */}
      <Modal id="DayDetailsModal">
        <div className="day-details-modal">
          {selectedDate && (
            <>
              <h2 className="">
                {formatDate(selectedDate)}
              </h2>
              
              <div className="day-details-section">
                <h3 className="">{t('calendar.tasks')}</h3>
                {selectedDayEvents?.tasks && selectedDayEvents.tasks.length > 0 ? (
                  <div className="tasks-list">
                    {selectedDayEvents.tasks.map(task => (
                      <div key={task.id} className="task-item-modal">
                        <span className={`task-title ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>{t('calendar.noTasks')}</p>
                    <button 
                      className="modal-edit-task-button mt-2"
                      onClick={() => window.location.href = '/tasks'}
                    >
                      {t('calendar.planTask')}
                    </button>
                  </div>
                )}
              </div>

              <div className="day-details-section">
                <h3 className="">{t('calendar.reminders')}</h3>
                {selectedDayEvents?.reminders && selectedDayEvents.reminders.length > 0 ? (
                  <div className="reminders-list">
                    {selectedDayEvents.reminders.map(reminder => (
                      <div key={reminder.id} className="reminder-item-modal">
                        <span className={`reminder-title ${reminder.completed ? 'line-through' : ''}`}>
                          {reminder.title}
                        </span>
                        {reminder.text && (
                          <p className="">
                            {reminder.text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>{t('calendar.noReminders')}</p>
                    <button 
                      className="modal-edit-task-button mt-2"
                      onClick={() => window.location.href = '/reminders'}
                    >
                      {t('calendar.planReminder')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </main>
  );
};

export default CalendarContent;