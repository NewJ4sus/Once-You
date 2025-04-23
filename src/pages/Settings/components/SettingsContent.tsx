import React, { useState } from 'react';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';
import { Link } from 'react-router-dom';
import { useUserSettings } from '@/context/UserSettingsContext';
import { useNoteTypes } from '@/context/NoteTypesContext';
import { useTranslation } from '@/i18n/TranslationContext';

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
            <h2 className="settings-section-title">{t('settings.appearance')}</h2>

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

            {/* <div className="settings-group">
                <label className="settings-label">{t('settings.themeType')}</label>
                
                  <Dropdown 
                      id="theme-type"
                      buttonContent={<span>{t(`settings.${userSettings?.themeType}`)}</span>}
                      buttonClassName="min-w-150"
                      key={userSettings?.themeType}
                  >
                      <ul className="dropdown-menu-list">
                          <li className="dropdown-menu-item">
                              <a href="#" onClick={() => handleSettingChange('themeType', 'standard')}>{t('settings.standard')}</a>
                          </li>
                          <li className="dropdown-menu-item">
                              <a href="#" onClick={() => handleSettingChange('themeType', 'glass')}>{t('settings.glass')}</a>
                          </li>
                      </ul>
                  </Dropdown>
            </div> */}

            {/* <div className="settings-group">
              <label className="settings-label">{t('settings.background')}</label>
                <Dropdown
                  id="background"
                  buttonContent={<span>{t(`settings.${userSettings?.background}`)}</span>}
                  buttonClassName="min-w-150"
                  key={userSettings?.background}
                >
                  <ul className="dropdown-menu-list">
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('background', 'solid')}>{t('settings.solid')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('background', 'noise')}>{t('settings.noise')}</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('background', 'gradient')}>{t('settings.gradient')}</a>
                    </li>
                  </ul>
                </Dropdown>
            </div> */}
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">{t('settings.preferences')}</h2>
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

            <div className="settings-group">
              <label className="settings-label">{t('settings.notifications')}</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={userSettings?.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
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
            <h2 className="settings-section-title">{t('settings.project')}</h2>
            <div className="settings-social-buttons">
              <Link to="/settings/social/github" className="settings-social-button">
                <i className="fa-brands fa-github"></i>
              </Link>
              <Link to="/settings/social/gitlab" className="settings-social-button">
                <i className="fa-brands fa-gitlab"></i>
              </Link>
              <Link to="/settings/social/zip" className="settings-social-button">
                <i className="fa-brands fa-file"></i>
              </Link>
              <Link to="/settings/social/yandex_disk" className="settings-social-button">
                <i className="fa-brands fa-yandex"></i>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </DropdownProvider>
  );
};

export default SettingsContent;