import React from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import TasksContent from './components/TasksContent';
import './TasksPage.css';

const Tasks: React.FC = () => {
  return (
    <div>
      <Headers namePage={"Tasks"}/>
      <Menu namePage={"Tasks"}/>
      <TasksContent/>
    </div>
  );
};

export default Tasks; 