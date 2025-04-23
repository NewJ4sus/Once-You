import React from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import InformationContent from './components/InformationContent';
import './InformationPage.css';

const Information: React.FC = () => {
  return (
    <div>
      <Headers namePage={"Information"}/>
      <Menu namePage={"Information"}/>
      <InformationContent/>
    </div>
  );
};

export default Information; 