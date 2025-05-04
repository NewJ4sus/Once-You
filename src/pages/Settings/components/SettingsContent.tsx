import React, { useState } from 'react';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';
import { useUserSettings } from '@/context/UserSettingsContext';
import { useNoteTypes } from '@/context/NoteTypesContext';
import { useTranslation } from '@/i18n/TranslationContext';
import { 
  deleteAllNotes, 
  deleteAllTasks, 
  deleteAllReminders, 
  deleteAllUserData 
} from '../../../config/userData';
import { notify } from '@/components/Notifications/Notification';

interface UserSettings {
  firstName: string;
  lastName: string;
  themeColor: 'light' | 'dark';
  themeType: 'standard' | 'glass';
  background: 'solid' | 'noise' | 'gradient';
  language: string;
  hideNoteText: boolean;
  notifications: boolean;
}
const SettingsContent: React.FC = () => {
  const { userSettings, updateSetting } = useUserSettings();
  const { noteTypes, addNoteType, removeNoteType } = useNoteTypes();
  const { t } = useTranslation();
  const [newNoteType, setNewNoteType] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSettingChange = async (key: keyof UserSettings, value: UserSettings[keyof UserSettings]) => {
    await updateSetting(key, value);
  };

  const handleNameChange = async (field: 'firstName' | 'lastName', value: string) => {
    await updateSetting(field, value);
  };

  const handleAddNoteType = async () => {
    if (newNoteType.trim() && !noteTypes.includes(newNoteType.trim())) {
      await addNoteType(newNoteType.trim());
      setNewNoteType('');
    }
  };

  const handleDeleteNotes = async () => {
    setDeleting('notes');
    await deleteAllNotes();
    setDeleting(null);
    notify.success('Все заметки удалены!');
  };
  const handleDeleteTasks = async () => {
    setDeleting('tasks');
    await deleteAllTasks();
    setDeleting(null);
    notify.success('Все задачи удалены!');
  };
  const handleDeleteReminders = async () => {
    setDeleting('reminders');
    await deleteAllReminders();
    setDeleting(null);
    notify.success('Все напоминания удалены!');
  };
  const handleDeleteAll = async () => {
    setDeleting('all');
    await deleteAllUserData();
    setDeleting(null);
    notify.success('Все данные пользователя удалены!');
  };

  return (
    <DropdownProvider>
      <main>
        <div className="settings-container">
          <div className="settings-section">
            <h2 className="settings-section-title">{t('settings.account')}</h2>
            <div className="settings-group" style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="settings-input"
                placeholder={t('settings.firstName')}
                value={userSettings?.firstName}
                onChange={(e) => handleNameChange('firstName', e.target.value)}
              />
              <input
                type="text"
                className="settings-input"
                placeholder={t('settings.lastName')}
                value={userSettings?.lastName}
                onChange={(e) => handleNameChange('lastName', e.target.value)}
              />
            </div>
          </div>
          <div className="settings-section">
            <h2 className="settings-section-title">{t('settings.basic')}</h2>

            <div className="settings-group">
              <label className="settings-label">{t('settings.themeColor')}</label>
                <Dropdown
                  id="theme-color"
                  buttonContent={<span>{t(`settings.${userSettings?.themeColor}`)}</span>}
                  buttonClassName="min-w-150"
                  key={userSettings?.themeColor}
                >
                  <ul className="dropdown-menu-list">
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'dark')}>{t('settings.dark')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'light')}>{t('settings.light')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'book')}>{t('settings.book')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'green')}>{t('settings.green')}</a>
                    </li>
                  </ul>
                </Dropdown>
            </div>

            <div className="settings-group">
              <label className="settings-label">{t('settings.language')}</label>

                <Dropdown
                  id="language"
                  buttonContent={<span>{userSettings?.language === 'ru' ? 'Русский' : 'English'}</span>}
                  buttonClassName="min-w-150"
                  key={userSettings?.language}
                >
                  <ul className="dropdown-menu-list">
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('language', 'en')}>English</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('language', 'ru')}>Русский</a>
                    </li>
                  </ul>
                </Dropdown>
                
            </div>

            <div className="settings-group">
              <label className="settings-label">{t('settings.hideNoteText')}</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={userSettings?.hideNoteText}
                  onChange={(e) => handleSettingChange('hideNoteText', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">{t('settings.noteTypes')}</h2>
            <div className="settings-group input_button_group">
                <input
                  type="text"
                  className="settings-input"
                  placeholder={t('settings.newNoteType')}
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  className="settings-button"
                  onClick={handleAddNoteType}
                  disabled={!newNoteType.trim() || noteTypes.includes(newNoteType.trim())}
                >
                  {t('settings.add')}
                </button>
            </div>
            <div className="note-types-list">
                {noteTypes.map((type) => (
                  <div key={type} className="note-type-item" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <span>{type}</span>
                    {type !== 'не выбрано' && (
                      <button
                        className="delete-button"
                        onClick={() => removeNoteType(type)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger-color)',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Удаление данных</h2>
            <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="input_button_group w-100">
                <span>Заметки</span>
                  <button 
                    className="settings-delete-button"
                    onClick={handleDeleteNotes}
                    disabled={deleting !== null}
                >
                  {deleting === 'notes' ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
              <div className="input_button_group w-100">
                <span>Задачи</span>
                <button 
                  className="settings-delete-button"
                  onClick={handleDeleteTasks}
                disabled={deleting !== null}
              >
                  {deleting === 'tasks' ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
              <div className="input_button_group w-100">
                <span>Напоминания</span>
                <button 
                  className="settings-delete-button"
                  onClick={handleDeleteReminders}
                  disabled={deleting !== null}
                >
                  {deleting === 'reminders' ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
              <div className="input_button_group w-100">
                <span>Всё</span>
                <button 
                  className="settings-delete-button"
                onClick={handleDeleteAll}
                disabled={deleting !== null}
              >
                  {deleting === 'all' ? 'Удаление...' : 'Удалить всё'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </DropdownProvider>
  );
};

export default SettingsContent;