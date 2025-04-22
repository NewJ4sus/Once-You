import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserSettings } from '@/context/UserSettingsContext';
import en from './translations/en';
import ru from './translations/ru';

// Определяем тип для переводов
type TranslationResource = Record<string, string | Record<string, any>>;
type Translations = {
  en: TranslationResource;
  ru: TranslationResource;
};

const translations: Translations = {
  en,
  ru,
};

interface TranslationContextType {
  t: (key: string) => string;
  currentLanguage: string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userSettings } = useUserSettings();
  const [currentLanguage, setCurrentLanguage] = useState(userSettings?.language || 'en');

  useEffect(() => {
    if (userSettings?.language) {
      setCurrentLanguage(userSettings.language);
    }
  }, [userSettings?.language]);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[currentLanguage as keyof Translations];
    
    for (const key of keys) {
      if (!current || current[key] === undefined) {
        console.warn(`Translation missing for key: ${path}`);
        return path;
      }
      current = current[key];
    }
    
    return typeof current === 'string' ? current : path;
  };

  return (
    <TranslationContext.Provider value={{ t, currentLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};