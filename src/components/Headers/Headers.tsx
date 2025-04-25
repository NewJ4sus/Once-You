import React, { useEffect } from 'react'
import { auth } from '@/config/firebase'
import { signOut } from 'firebase/auth'
import { useNavigate, useLocation } from 'react-router-dom'

import SVG from '../SVG/SVG';
import { useAppContext } from '@/context/AppContext';
import { Dropdown, DropdownProvider } from '../Dropdown/Dropdown';
import './Headers.css';
import UserDisplayName from './UserDisplayName';
import { useTranslation } from '@/i18n/TranslationContext';

interface HeadersProps {
  namePage: string;
}

const Headers: React.FC<HeadersProps> = ({ namePage }) => {
  const { toggleMenu, toggleFolder } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isNotesPage = location.pathname === '/notes';
  const { t } = useTranslation();
  const handleLogout = () => {
      signOut(auth)
      navigate('/login')
  }

  useEffect(() => {
      // Add event listener for open folder button if on notes page
      if (isNotesPage) {
          const openFolderButton = document.querySelector('.open-folder-button')
          const secondarySidebar = document.querySelector('.secondary-sidebar-menu-overlay')
          const sidebarMenu = document.querySelector('.sidebar-menu')

          const handleOpenFolder = () => {
              secondarySidebar?.classList.toggle('active')
              if (window.innerWidth <= 1200) {
                  sidebarMenu?.classList.remove('active')
              }
          }

          openFolderButton?.addEventListener('click', handleOpenFolder)

          return () => {
              openFolderButton?.removeEventListener('click', handleOpenFolder)
          }
      }
  }, [isNotesPage])

  return (
    <header>
      <div className="header-left">
        <span className="bold">Once You <kbd className='kdb-version'>v.1.0</kbd></span>
        <span className="header-left__namePage">
          {namePage}
        </span>
        <div className='header-left__menu'>
          {namePage === "Notes" && (
              <li className="folder-button" onClick={toggleFolder}>
                  <span>{t('header.folderBtn')}</span>
              </li>
          )}
          <div className="mobile-menu-button" onClick={toggleMenu}>
              <SVG name="menu"/>
          </div>
        </div>
      </div>
      <div className="header-right">
        <DropdownProvider>
          <Dropdown 
            id="user"
            buttonContent={<UserDisplayName />}
            buttonClassName="w-100"
          >
            <ul className="dropdown-menu-list">
              <li className="dropdown-menu-item">
                <a href="#" onClick={handleLogout}>
                  <SVG name="door"/>
                  {t('header.logout')}
                </a>
              </li>
            </ul>
          </Dropdown>
        </DropdownProvider>
      </div>
    </header>
  );
};

export default Headers;