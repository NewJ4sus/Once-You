import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/config/firebase';
import { updateUserSettings } from '@/config/userSettings';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UserSettings {
  firstName: string;
  lastName: string;
  themeColor: 'light' | 'dark';
  background: 'solid' | 'noise' | 'gradient';
  language: string;
  hideNoteText: boolean;
  typeUser: 'default';
  group: 'admin' | 'moderator' | 'user';
}

interface UserSettingsContextType {
  userSettings: UserSettings | null;
  setUserSettings: (settings: UserSettings) => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Подписываемся на изменения в Firestore
        const userId = user.uid;
        const settingsRef = doc(db, 'userSettings', userId);
        
        const unsubscribeSnapshot = onSnapshot(settingsRef, async (doc) => {
          if (doc.exists()) {
            setUserSettings(doc.data() as UserSettings);
          } else {
            // Если документ не существует, создаем его с дефолтными значениями
            const defaultSettings: UserSettings = {
              firstName: '',
              lastName: '',
              themeColor: 'dark',
              background: 'solid',
              language: 'ru',
              hideNoteText: false,
              typeUser: 'default',
              group: 'user'
            };
            
            try {
              await setDoc(settingsRef, defaultSettings);
              setUserSettings(defaultSettings);
            } catch (error) {
              console.error('Error creating user settings:', error);
              setUserSettings(defaultSettings);
            }
          }
        });
        
        // Возвращаем функцию очистки для отписки
        return () => {
          unsubscribeSnapshot();
        };
      } else {
        setUserSettings(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateSettingsState = async (newSettings: UserSettings) => {
    // Обновляем локальное состояние сразу
    setUserSettings(newSettings);
    
    // Создаем объект с изменениями
    const changes: Partial<UserSettings> = {};
    
    // Проверяем каждое поле
    if (userSettings) {
      if (userSettings.firstName !== newSettings.firstName) changes.firstName = newSettings.firstName;
      if (userSettings.lastName !== newSettings.lastName) changes.lastName = newSettings.lastName;
      if (userSettings.themeColor !== newSettings.themeColor) changes.themeColor = newSettings.themeColor;
      if (userSettings.background !== newSettings.background) changes.background = newSettings.background;
      if (userSettings.language !== newSettings.language) changes.language = newSettings.language;
      if (userSettings.hideNoteText !== newSettings.hideNoteText) changes.hideNoteText = newSettings.hideNoteText;
      if (userSettings.group !== newSettings.group) changes.group = newSettings.group;
    }
    
    await updateUserSettings(changes);
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!userSettings) return;
    const newSettings = { ...userSettings, [key]: value };
    
    if (key === 'themeColor') {
      localStorage.setItem('theme', value as string);
    }
    
    await updateSettingsState(newSettings);
  };

  return (
    <UserSettingsContext.Provider
      value={{
        userSettings,
        setUserSettings: updateSettingsState,
        updateSetting,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}; 