import React from 'react';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';
import { Link } from 'react-router-dom';
import { useUserSettings } from '@/context/UserSettingsContext';

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

  const handleSettingChange = async (key: keyof UserSettings, value: UserSettings[keyof UserSettings]) => {
    await updateSetting(key, value);
  };

  const handleNameChange = async (field: 'firstName' | 'lastName', value: string) => {
    await updateSetting(field, value);
  };

  return (
    <DropdownProvider>
      <main>
        <div className="settings-container">
          <div className="settings-section">
            <h2 className="settings-section-title">Account</h2>
            <div className="settings-group" style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="settings-input"
                placeholder="First Name"
                value={userSettings?.firstName}
                onChange={(e) => handleNameChange('firstName', e.target.value)}
              />
              <input
                type="text"
                className="settings-input"
                placeholder="Last Name"
                value={userSettings?.lastName}
                onChange={(e) => handleNameChange('lastName', e.target.value)}
              />
            </div>
          </div>
          <div className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>

            <div className="settings-group">
              <label className="settings-label">Theme Color</label>
                <Dropdown
                  id="theme-color"
                  buttonContent={<span>{userSettings?.themeColor}</span>}
                  buttonClassName="min-w-150"
                  key={userSettings?.themeColor}
                >
                  <ul className="dropdown-menu-list">
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'dark')}>Dark</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'light')}>Light</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'book')}>Book</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('themeColor', 'green')}>Green</a>
                    </li>
                  </ul>
                </Dropdown>
            </div>

            <div className="settings-group">
                <label className="settings-label">Theme Type</label>
                
                  <Dropdown 
                      id="theme-type"
                      buttonContent={<span>{userSettings?.themeType}</span>}
                      buttonClassName="min-w-150"
                      key={userSettings?.themeType}
                  >
                      <ul className="dropdown-menu-list">
                          <li className="dropdown-menu-item">
                              <a href="#" onClick={() => handleSettingChange('themeType', 'standard')}>Standard</a>
                          </li>
                          <li className="dropdown-menu-item">
                              <a href="#" onClick={() => handleSettingChange('themeType', 'glass')}>Glass</a>
                          </li>
                      </ul>
                  </Dropdown>
            </div>

            <div className="settings-group">
              <label className="settings-label">Background</label>
                <Dropdown
                  id="background"
                  buttonContent={<span>{userSettings?.background}</span>}
                  buttonClassName="min-w-150"
                  key={userSettings?.background}
                >
                  <ul className="dropdown-menu-list">
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('background', 'solid')}>Solid</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('background', 'noise')}>Noise</a>
                    </li>
                    <li className="dropdown-menu-item">
                      <a href="#" onClick={() => handleSettingChange('background', 'gradient')}>Gradient</a>
                    </li>
                  </ul>
                </Dropdown>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Preferences</h2>
            <div className="settings-group">
              <label className="settings-label">Language</label>

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
              <label className="settings-label">Hide text in note files</label>
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
              <label className="settings-label">Enable reminder notifications</label>
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
            <h2 className="settings-section-title">Contact & Support</h2>
            <div className="settings-buttons">
              <button className="settings-button">Suggest an Idea</button>
              <button className="settings-button">Donate</button>
            </div>

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