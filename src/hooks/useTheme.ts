import { useEffect } from 'react';
import { useUserSettings } from '@/context/UserSettingsContext';

export const useTheme = () => {
  const { userSettings } = useUserSettings();

  useEffect(() => {
    const theme = userSettings?.themeColor || localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [userSettings?.themeColor]);

  return {
    theme: userSettings?.themeColor || localStorage.getItem('theme') || 'light'
  };
}; 