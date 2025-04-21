import React from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import SettingsContent from './components/SettingsContent';
import './SettingsPage.css';
const Settings: React.FC = () => {
  return (
    <div>
      <Headers namePage={"Settings"}/>
      <Menu namePage={"Settings"}/>
      <SettingsContent/>
    </div>
  );
};

export default Settings; 