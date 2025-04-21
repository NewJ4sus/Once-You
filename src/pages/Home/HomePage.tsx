import React from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import HomeContent from './components/HomeContent';
import './HomePage.css';

const Home: React.FC = () => {
  return (
    <div>
      <Headers namePage={"Home"}/>
      <Menu namePage={"Home"}/>
      <HomeContent/>
    </div>
  );
};

export default Home; 