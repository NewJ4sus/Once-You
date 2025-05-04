import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import SVG from '@/components/SVG/SVG';
import { useAppContext } from '@/context/AppContext';
import { useTranslation } from '@/i18n/TranslationContext';
import './Menu.css';

interface MenuProps {
    namePage: string;
}

const Menu: React.FC<MenuProps> = ({ namePage }) => {
  const { isMenuOpen, menuRef, closeMenu } = useAppContext();
  const [counts, setCounts] = useState({
    tasks: 0,
    notes: 0,
    reminders: 0
  });
  const { t } = useTranslation();
  
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    
    // Subscribe to tasks collection
    const tasksRef = collection(db, 'tasks', userId, 'userTasks');
    const tasksQuery = query(tasksRef);
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const incompleteTasks = snapshot.docs.filter(doc => !doc.data().completed).length;
      setCounts(prev => ({ ...prev, tasks: incompleteTasks }));
    });

    // Subscribe to notes collection
    const notesRef = collection(db, 'notes', userId, 'userNotes');
    const notesQuery = query(notesRef);
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, notes: snapshot.docs.length }));
    });

    // Subscribe to reminders collection
    const remindersRef = collection(db, 'reminders', userId, 'userReminders');
    const remindersQuery = query(remindersRef);
    const unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
      const incompleteReminders = snapshot.docs.filter(doc => !doc.data().completed).length;
      setCounts(prev => ({ ...prev, reminders: incompleteReminders }));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeNotes();
      unsubscribeReminders();
    };
  }, []);
  
  const menuClassName = `sidebar-menu ${isMenuOpen ? 'active' : ''}`;

//   const handleMenuItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const handleMenuItemClick = () => {
    closeMenu();
  };

  return (
    <aside className={menuClassName} ref={menuRef}>
        <div className="sidebar-menu-header">
            <ul className="sidebar-menu-list">
                <li className={`sidebar-menu-item ${namePage === "Home" ? "active" : ""}`}>
                    <Link to="/" onClick={handleMenuItemClick}>
                        <SVG name="home"/>
                        <span>{t('menu.home')}</span>
                    </Link>
                </li>
                <li className={`sidebar-menu-item ${namePage === "Tasks" ? "active" : ""}`}>
                    <Link to="/tasks" onClick={handleMenuItemClick}>
                        <SVG name="task"/>
                        <span>{t('menu.tasks')}</span>
                        {counts.tasks > 0 && <span className="badge">{counts.tasks}</span>}
                    </Link>
                </li>
                <li className={`sidebar-menu-item ${namePage === "Notes" ? "active" : ""}`}>
                    <Link to="/notes" onClick={handleMenuItemClick}>
                        <SVG name="note"/>
                        <span>{t('menu.notes')}</span>
                        {counts.notes > 0 && <span className="badge">{counts.notes}</span>}
                    </Link>
                </li>
                <li className={`sidebar-menu-item ${namePage === "Calendar" ? "active" : ""}`}>
                    <Link to="/calendar" onClick={handleMenuItemClick}>
                        <SVG name="calendar"/>
                        <span>{t('menu.calendar')}</span>
                    </Link>
                </li>
                <li className={`sidebar-menu-item ${namePage === "Reminders" ? "active" : ""}`}>
                    <Link to="/reminders" onClick={handleMenuItemClick}>
                        <SVG name="clock"/>
                        <span>{t('menu.reminders')}</span>
                        {counts.reminders > 0 && <span className="badge">{counts.reminders}</span>}
                    </Link>
                </li>
            </ul>
        </div>
        <div className="sidebar-menu-footer">
            <ul className="sidebar-menu-list">
                <li className={`sidebar-menu-item ${namePage === "Settings" ? "active" : ""}`}>
                    <Link to="/settings" onClick={handleMenuItemClick}>
                        <SVG name="settings"/>
                        <span>{t('menu.settings')}</span>
                    </Link>
                </li>
                <li className={`sidebar-menu-item mobile-hidden ${namePage === "Information" ? "active" : ""}`}>
                    <Link to="/information" onClick={handleMenuItemClick}>
                        <SVG name="info"/>
                        <span>{t('menu.information')}</span>
                    </Link>
                </li>
            </ul>
        </div>
    </aside>
  );
};

export default Menu;