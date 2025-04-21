import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';

interface AppContextType {
  isMenuOpen: boolean;
  isFolderOpen: boolean;
  toggleMenu: () => void;
  toggleFolder: () => void;
  closeMenu: () => void;
  closeFolder: () => void;
  folderRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const folderRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Обработчик клика вне компонента FolderNotes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFolderOpen && folderRef.current && !folderRef.current.contains(event.target as Node)) {
        setIsFolderOpen(false);
      }
      
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFolderOpen, isMenuOpen]);

  const toggleMenu = () => {
    // Если папка открыта, закрываем её перед открытием меню
    if (isFolderOpen) {
      setIsFolderOpen(false);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleFolder = () => {
    setIsFolderOpen(!isFolderOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const closeFolder = () => {
    setIsFolderOpen(false);
  };

  return (
    <AppContext.Provider value={{ 
      isMenuOpen, 
      isFolderOpen, 
      toggleMenu, 
      toggleFolder,
      closeMenu,
      closeFolder,
      folderRef,
      menuRef
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 