import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  id: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ 
  id, 
  children
}) => {
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const modal = document.getElementById(id);
      // Проверяем что клик был по самому модальному окну (фону), а не по его содержимому
      if (modal && e.target === modal) {
        modal.classList.remove('active');
        // Разблокируем прокрутку при закрытии
        document.body.style.overflow = 'auto';
      }
    };

    // Наблюдаем за изменением класса active у модального окна
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const modal = mutation.target as HTMLElement;
          if (modal.classList.contains('active')) {
            // Блокируем прокрутку при открытии
            document.body.style.overflow = 'hidden';
          } else {
            // Разблокируем прокрутку при закрытии
            document.body.style.overflow = 'auto';
          }
        }
      });
    });

    const modal = document.getElementById(id);
    if (modal) {
      observer.observe(modal, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Добавляем слушатель события
    document.addEventListener('click', handleOutsideClick);

    // Очищаем слушатели и наблюдатель при размонтировании
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      observer.disconnect();
      // Восстанавливаем прокрутку при размонтировании компонента
      document.body.style.overflow = 'auto';
    };
  }, [id]);

  return (
    <div id={id} className="modal">
      <div className="modal-content">
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;