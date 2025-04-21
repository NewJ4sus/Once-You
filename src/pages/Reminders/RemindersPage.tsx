import React from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import RemindersContent from './components/RemindersContent';
import './RemindersPage.css';

const Reminders: React.FC = () => {
  return (
    <div>
      <Headers namePage={"Reminders"}/>
      <Menu namePage={"Reminders"}/>
      <RemindersContent/>
    </div>
  );
};

export default Reminders; 