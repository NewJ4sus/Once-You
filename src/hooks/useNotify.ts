import { useNotification } from '@/context/NotificationContext';

export const useNotify = () => {
  const { showNotification } = useNotification();

  const notify = (
    title: string,
    text: string,
    options?: {
      sound?: boolean;
      onClick?: () => void;
    }
  ) => {
    showNotification({
      title,
      text,
      sound: options?.sound,
      onClick: options?.onClick,
    });
  };

  return { notify };
};