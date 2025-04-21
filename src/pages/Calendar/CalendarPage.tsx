import React from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import CalendarContent from './components/CalendarContent';
import './CalendarPage.css';

const Calendar: React.FC = () => {
  return (
    <div>
      <Headers namePage={"Calendar"}/>
      <Menu namePage={"Calendar"}/>
      <CalendarContent/>
    </div>
  );
};

export default Calendar; 