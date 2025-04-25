import React from 'react';
import { useNotify } from '@/hooks/useNotify';

const HomeContent: React.FC = () => {
  const { notify } = useNotify();

  const handleClick = () => {
    notify('Напоминание', 'Вы должны выполнить задачу', {
      type: 'medium',
      sound: true,
      onClick: () => window.location.href = '/tasks',
    });
  };

  return (
    <main>
      <span>Home Content</span>
        <button onClick={handleClick}>
        Trigger Notification
      </button>
    </main>
  );
};

export default HomeContent;