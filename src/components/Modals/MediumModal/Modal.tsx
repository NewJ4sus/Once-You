import React, { useEffect, useState } from 'react';
import './Modal.css';

interface ModalProps {
  id: string;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  id, 
  children, 
  // title = 'Modal'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Function to handle opening the modal
    const openModal = () => {
      setIsOpen(true);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    };

    // Function to handle closing the modal
    const closeModal = () => {
      setIsOpen(false);
      document.body.style.overflow = ''; // Restore scrolling
    };

    // Function to handle clicking outside the modal
    const handleOutsideClick = (e: MouseEvent) => {
      const modalContent = document.querySelector(`#${id} .modal-content`);
      if (modalContent && !modalContent.contains(e.target as Node)) {
        closeModal();
      }
    };

    // Function to handle escape key press
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    // Add event listeners
    const openButton = document.querySelector(`[data-modal-target="${id}"]`);
    if (openButton) {
      openButton.addEventListener('click', openModal);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup function
    return () => {
      if (openButton) {
        openButton.removeEventListener('click', openModal);
      }
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = ''; // Ensure scrolling is restored
    };
  }, [id]);

  return (
    <div id={id} className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        {/* <div className="modal-header">
          <h2>{title}</h2>
        </div> */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;