import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query,
  onSnapshot, 
  updateDoc,
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import SVG from '../../../components/SVG/SVG';
import Modal from '@/components/Modals/MediumModal/Modal';
import { useTranslation } from '@/i18n/TranslationContext';

// Define types for our task
interface Task {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  type: 'standard' | 'medium' | 'high';
  createdAt: Date | null;
  startDate: Date | null;
  deadlineDate: Date | null;
}

const TasksContent: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'completed'>('current');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // State for editing task
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState<'standard' | 'medium' | 'high'>('standard');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editDeadlineDate, setEditDeadlineDate] = useState<string>('');
  const [editDeadlineTime, setEditDeadlineTime] = useState<string>('');

  // Add new state for forcing progress bar updates
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);

  // Load tasks from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const tasksRef = collection(db, 'tasks', userId, 'userTasks');
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasksData.push({ 
          id: doc.id, 
          title: data.title || '',
          text: data.text || '', 
          completed: data.completed || false,
          createdAt: data.createdAt?.toDate() || null,
          startDate: data.startDate?.toDate() || null,
          deadlineDate: data.deadlineDate?.toDate() || null,
          type: data.type || 'standard'
        });
      });
      
      // Sort tasks by creation date (newest first)
      tasksData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new useEffect for progress bar updates
  useEffect(() => {
    // Update progress bars every 3 seconds
    const intervalId = setInterval(() => {
      setProgressUpdateTrigger(prev => prev + 1);
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const now = new Date();
      
      await addDoc(collection(db, 'tasks', userId, 'userTasks'), {
        title: taskTitle.trim(),
        text: '',
        completed: false,
        type: 'standard',
        createdAt: now,
        startDate: now,
        deadlineDate: null
      });
      
      setTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const taskRef = doc(db, 'tasks', userId, 'userTasks', taskId);
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        await updateDoc(taskRef, {
          completed: !task.completed
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, 'tasks', userId, 'userTasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Function to open the edit modal with task data
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditText(task.text);
    setEditType(task.type);
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (task.startDate) {
      const date = task.startDate.toISOString().split('T')[0];
      const time = `${String(task.startDate.getHours()).padStart(2, '0')}:${String(task.startDate.getMinutes()).padStart(2, '0')}`;
      setEditStartDate(date);
      setEditStartTime(time);
    } else {
      setEditStartDate(currentDate);
      setEditStartTime(currentTime);
    }
    
    if (task.deadlineDate) {
      const date = task.deadlineDate.toISOString().split('T')[0];
      const time = `${String(task.deadlineDate.getHours()).padStart(2, '0')}:${String(task.deadlineDate.getMinutes()).padStart(2, '0')}`;
      setEditDeadlineDate(date);
      setEditDeadlineTime(time);
    } else {
      setEditDeadlineDate('');
      setEditDeadlineTime('');
    }
    
    const modal = document.getElementById('EditModalTask');
    if (modal) {
      modal.classList.add('active');
    }
  };

  // Function to save edited task
  const handleSaveTask = async () => {
    if (!auth.currentUser || !editingTask) return;

    try {
      const userId = auth.currentUser.uid;
      const taskRef = doc(db, 'tasks', userId, 'userTasks', editingTask.id);
      
      let startDateObj = null;
      if (editStartDate && editStartTime) {
        startDateObj = new Date(`${editStartDate}T${editStartTime}`);
      }
      
      let deadlineDateObj = null;
      if (editDeadlineDate) {
        // If deadline time is not set, use the start time
        const timeToUse = editDeadlineTime || editStartTime;
        deadlineDateObj = new Date(`${editDeadlineDate}T${timeToUse}`);
      }
      
      const updateData = {
        title: editTitle,
        text: editText,
        type: editType,
        startDate: startDateObj,
        deadlineDate: deadlineDateObj
      };
      
      await updateDoc(taskRef, updateData);
      
      const modal = document.getElementById('EditModalTask');
      if (modal) {
        modal.classList.remove('active');
      }
      
      setEditingTask(null);
    } catch (error) {
      console.error('Error in handleSaveTask:', error);
    }
  };

  // Function to handle type selection
  const handleTypeChange = (type: 'standard' | 'medium' | 'high') => {
    setEditType(type);
  };

  const currentTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Add this helper function before renderTaskItem
  const calculateProgress = (startDate: Date | null, deadlineDate: Date | null): number | null => {
    if (!startDate || !deadlineDate) return null;

    const now = new Date();
    
    const normalizedStartDate = new Date(startDate);
    const normalizedDeadline = new Date(deadlineDate);
    const normalizedNow = new Date(now);

    if (startDate.getHours() === 0 && startDate.getMinutes() === 0 && startDate.getSeconds() === 0) {
      normalizedStartDate.setHours(0, 0, 0, 0);
    }
    
    if (deadlineDate.getHours() === 0 && deadlineDate.getMinutes() === 0 && deadlineDate.getSeconds() === 0) {
      normalizedDeadline.setHours(23, 59, 59, 999);
    }

    const total = normalizedDeadline.getTime() - normalizedStartDate.getTime();
    const elapsed = normalizedNow.getTime() - normalizedStartDate.getTime();
    
    if (normalizedNow > normalizedDeadline) return 100;
    if (normalizedNow < normalizedStartDate) return 0;
    
    const progress = (elapsed / total) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const renderTaskItem = (task: Task) => (
    <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${task.type}`}>
      <input 
        type="checkbox" 
        className="task-checkbox"
        checked={task.completed}
        onChange={() => handleTaskToggle(task.id)}
      />
      <div className="task-content">
        <div className='task-content-title'>
          <span className='task-title'>{task.title}</span>
          {task.startDate && task.deadlineDate && (
            <small>{`${(calculateProgress(task.startDate, task.deadlineDate) || 0).toFixed(2)} %`}</small>
          )}
        </div>
        
        {task.startDate && task.deadlineDate && (
          <div className="task-progress">
            <div 
              className="progress-bar" 
              style={{ 
                '--progress': `${calculateProgress(task.startDate, task.deadlineDate)}%`,
                key: progressUpdateTrigger
              } as React.CSSProperties}
            >
              <div className="progress-fill"></div>
            </div>
          </div>
        )}
      </div>
      <div className="task-actions">
        <button 
          className="task-edit"
          onClick={() => handleEditTask(task)}
        >
          <SVG name="pen" />
        </button>
        <button 
          className="task-delete"
          onClick={() => handleDeleteTask(task.id)}
        >
          <SVG name="trash" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">{t('task.loading')}</div>;
  }

  return (
    <main>
      <div className="task-container">
        <div className="task-input-container">
          <input 
            type="text" 
            className="task-input" 
            placeholder={t('task.title')}
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="add-task-btn" onClick={handleAddTask}>
            <span>{t('task.addTask')}</span>
          </button>
        </div>

        <div className="task-tabs">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => setActiveTab('current')}
            >
              {t('task.currentTask')} ({currentTasks.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              {t('task.completedTask')} ({completedTasks.length})
            </button>
          </div>

          <div className="tab-content">
            <div className={`tab-pane ${activeTab === 'current' ? 'active' : ''}`} id="current-tasks">
              <div className="task-list">
                {currentTasks.length > 0 ? (
                  currentTasks.map(task => renderTaskItem(task))
                ) : (
                  <div className="empty-state">{t('task.noTask')}</div>
                )}
              </div>
            </div>
            <div className={`tab-pane ${activeTab === 'completed' ? 'active' : ''}`} id="completed-tasks">
              <div className="task-list">
                {completedTasks.length > 0 ? (
                  completedTasks.map(task => renderTaskItem(task))
                ) : (
                  <div className="empty-state">{t('task.noTask')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal id="EditModalTask" title="Edit">
        <div className='modal-edit-task'>
          <input 
            className='modal-edit-task-input' 
            type="text" 
            placeholder={t('task.title')} 
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <textarea 
            className='modal-edit-task-textarea' 
            placeholder={t('task.description')} 
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className='modal-edit-task-type'>
            <input 
              type="checkbox" 
              className="btn-check" 
              id="standard" 
              checked={editType === 'standard'}
              onChange={() => handleTypeChange('standard')}
            />
            <label className="button-priority" htmlFor="standard">{t('task.standard')}</label>
            <input 
              type="checkbox" 
              className="btn-check" 
              id="medium" 
              checked={editType === 'medium'}
              onChange={() => handleTypeChange('medium')}
            />
            <label className="button-priority" htmlFor="medium">{t('task.medium')}</label>
            <input 
              type="checkbox" 
              className="btn-check" 
              id="high" 
              checked={editType === 'high'}
              onChange={() => handleTypeChange('high')}
            />
            <label className="button-priority" htmlFor="high">{t('task.high')}</label>
          </div>
          <div className='modal-edit-task-date'>
            <div className="date-field">
              <label htmlFor="start-date">{t('task.dateAt')}:</label>
              <div className="date-time-inputs">
                <input 
                  id="start-date"
                  className='modal-edit-task-input' 
                  type="date" 
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
                <input 
                  id="start-time"
                  className='modal-edit-task-input' 
                  type="time" 
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="date-field">
              <label htmlFor="deadline-date">{t('task.dateDeadline')}:</label>
              <div className="date-time-inputs">
                <input 
                  id="deadline-date"
                  className='modal-edit-task-input' 
                  type="date"
                  value={editDeadlineDate}
                  onChange={(e) => setEditDeadlineDate(e.target.value)}
                />
                <input 
                  id="deadline-time"
                  className='modal-edit-task-input' 
                  type="time"
                  value={editDeadlineTime}
                  onChange={(e) => setEditDeadlineTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className='modal-edit-task-buttons'>
            <button 
              className='modal-edit-task-button'
              onClick={handleSaveTask}
            >
              {t('task.saveTask')}
            </button>
            <button 
              className='modal-edit-task-button cancel'
              onClick={() => {
                const modal = document.getElementById('EditModalTask');
                if (modal) {
                  modal.classList.remove('active');
                }
                setEditingTask(null);
              }}
            >
              {t('task.cancelTask')}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default TasksContent; 