import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query,
  onSnapshot, 
  updateDoc,
  deleteDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import SVG from '../../../components/SVG/SVG';
import Modal from '@/components/Modals/MediumModal/Modal';
import { useTranslation } from '@/i18n/TranslationContext';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';

// Define types for our reminder
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

const RemindersContent: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderTitle, setReminderTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'completed'>('current');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // State for editing reminder
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editRepeat, setEditRepeat] = useState(false);
  const [editRepeatInterval, setEditRepeatInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Load reminders from Firestore
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
          notificationShown: data.notificationShown || false
        });
      });

      setReminders(remindersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddReminder = async () => {
    if (!reminderTitle.trim() || !auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 3);
      
      await addDoc(collection(db, 'reminders', userId, 'userReminders'), {
        title: reminderTitle.trim(),
        text: '',
        completed: false,
        reminderDate: Timestamp.fromDate(currentDate),
        repeat: false,
        repeatInterval: 'daily',
        createdAt: Timestamp.now(),
        notificationShown: false
      });
      
      setReminderTitle('');
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddReminder();
    }
  };

  const handleReminderToggle = async (reminderId: string) => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const reminderRef = doc(db, 'reminders', userId, 'userReminders', reminderId);
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (reminder) {
        await updateDoc(reminderRef, {
          completed: !reminder.completed
        });
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, 'reminders', userId, 'userReminders', reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setEditTitle(reminder.title);
    setEditText(reminder.text);
    setEditRepeat(reminder.repeat);
    setEditRepeatInterval(reminder.repeatInterval || 'daily');
    
    if (reminder.reminderDate) {
      const date = reminder.reminderDate.toISOString().split('T')[0];
      const time = reminder.reminderDate.toTimeString().slice(0, 5);
      setEditDate(date);
      setEditTime(time);
    } else {
      setEditDate('');
      setEditTime('');
    }
    
    const modal = document.getElementById('EditModalReminder');
    if (modal) {
      modal.classList.add('active');
    }
  };

  const handleSaveReminder = async () => {
    if (!auth.currentUser || !editingReminder) return;

    try {
      const userId = auth.currentUser.uid;
      const reminderRef = doc(db, 'reminders', userId, 'userReminders', editingReminder.id);
      
      let reminderDateObj = null;
      if (editDate) {
        const dateStr = editDate;
        const timeStr = editTime || '00:00';
        const dateTimeStr = `${dateStr}T${timeStr}`;
        reminderDateObj = new Date(dateTimeStr);
        reminderDateObj = Timestamp.fromDate(reminderDateObj);
      }
      
      const updateData = {
        title: editTitle,
        text: editText,
        reminderDate: reminderDateObj,
        repeat: editRepeat,
        repeatInterval: editRepeatInterval,
        notificationShown: false // Сбрасываем флаг при любом изменении времени
      };
      
      await updateDoc(reminderRef, updateData);
      
      const modal = document.getElementById('EditModalReminder');
      if (modal) {
        modal.classList.remove('active');
      }
      
      setEditingReminder(null);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const renderReminderItem = (reminder: Reminder) => (
    <div key={reminder.id} className={`reminder-item ${reminder.completed ? 'completed' : ''}`}>
      <input 
        type="checkbox" 
        className="reminder-checkbox"
        checked={reminder.completed}
        onChange={() => handleReminderToggle(reminder.id)}
      />
      <div className="reminder-content">
        <div className='reminder-content-title'>
          <span className='reminder-title'>{reminder.title}</span>
          {reminder.reminderDate && (
            <small>
              {reminder.reminderDate.toLocaleString()}
              {reminder.repeat && ` (${t(`reminders.${reminder.repeatInterval}`)})`}
            </small>
          )}
        </div>
      </div>
      <div className="reminder-actions">
        <button 
          className="reminder-edit"
          onClick={() => handleEditReminder(reminder)}
        >
          <SVG name="pen" />
        </button>
        <button 
          className="reminder-delete"
          onClick={() => handleDeleteReminder(reminder.id)}
        >
          <SVG name="trash" />
        </button>
      </div>
    </div>
  );

  const currentReminders = reminders.filter(reminder => !reminder.completed);
  const completedReminders = reminders.filter(reminder => reminder.completed);

  if (loading) {
    return <main className="ml-600"><div className="no_note_content"><p>{t('reminders.loading')}</p></div></main>
  }

  return (
      <main>
        <div className="reminder-container">
          <div className="reminder-input-container">
            <input 
              type="text" 
              className="reminder-input" 
              placeholder={t('reminders.reminderTitle')}
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="add-reminder-btn" onClick={handleAddReminder}>
              <span>{t('reminders.addReminder')}</span>
            </button>
          </div>

          <div className="reminder-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                onClick={() => setActiveTab('current')}
              >
                {t('reminders.currentReminders')} ({currentReminders.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                {t('reminders.completedReminders')} ({completedReminders.length})
              </button>
            </div>

            <div className="tab-content">
              <div className={`tab-pane ${activeTab === 'current' ? 'active' : ''}`}>
                <div className="reminder-list">
                  {currentReminders.length > 0 ? (
                    currentReminders.map(reminder => renderReminderItem(reminder))
                  ) : (
                    <div className="empty-state">{t('reminders.noCurrentReminders')}</div>
                  )}
                </div>
              </div>
              <div className={`tab-pane ${activeTab === 'completed' ? 'active' : ''}`}>
                <div className="reminder-list">
                  {completedReminders.length > 0 ? (
                    completedReminders.map(reminder => renderReminderItem(reminder))
                  ) : (
                    <div className="empty-state">{t('reminders.noCompletedReminders')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Reminder Modal */}
        <Modal id="EditModalReminder" title="Edit">
          <div className='modal-edit-task'>
            <input 
              className='modal-edit-task-input' 
              type="text" 
              placeholder={t('reminders.reminderTitle')} 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea 
              className='modal-edit-task-textarea' 
              placeholder={t('reminders.reminderDescription')} 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className='modal-edit-task-date'>
              <div className="date-field">
                <label htmlFor="reminder-date">{t('reminders.reminderDate')}</label>
                <input 
                  id="reminder-date"
                  className='modal-edit-task-input' 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="date-field">
                <label htmlFor="reminder-time">{t('reminders.reminderTime')}</label>
                <input 
                  id="reminder-time"
                  className='modal-edit-task-input' 
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>

            <div className='modal-edit-task-repeat'>
              <label className="repeat-checkbox">
                <input 
                  type="checkbox"
                  checked={editRepeat}
                  onChange={(e) => setEditRepeat(e.target.checked)}
                />
                {t('reminders.repeat')}
              </label>

              {editRepeat && (
                <DropdownProvider>
                <Dropdown
                  id="repeat-interval"
                  buttonContent={<span>{t(`reminders.${editRepeatInterval}`)}</span>}
                  buttonClassName="min-w-150"
                  key={editRepeatInterval}
                >
                  <ul className="dropdown-menu-list">
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => setEditRepeatInterval('daily')}>{t('reminders.daily')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => setEditRepeatInterval('weekly')}>{t('reminders.weekly')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => setEditRepeatInterval('monthly')}>{t('reminders.monthly')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => setEditRepeatInterval('yearly')}>{t('reminders.yearly')}</a>
                    </li>
                  </ul>
                </Dropdown>
                </DropdownProvider>
              )}
            </div>

            <div className='modal-edit-task-buttons'>
              <button 
                className='modal-edit-task-button'
                onClick={handleSaveReminder}
              >
                {t('reminders.save')}
              </button>
              <button 
                className='modal-edit-task-button cancel'
                onClick={() => {
                  const modal = document.getElementById('EditModalReminder');
                  if (modal) {
                    modal.classList.remove('active');
                  }
                  setEditingReminder(null);
                }}
              >
                {t('reminders.cancel')}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    
  );
};

export default RemindersContent;