import React from 'react';
import { useUserSettings } from '@/context/UserSettingsContext';

const AdminPanel: React.FC = () => {
  const { userSettings } = useUserSettings();

  return (
    <main>
      {userSettings?.group === 'admin' && (
        <span>Важная кнопка</span>
      )}
    </main>
  );
};

export default AdminPanel;