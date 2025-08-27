
import React from 'react';
import Navigation from '../components/Navigation';
import ListView from '../components/ListView';
import BottomNavigation from '@/components/navigation/BottomNavigation';

const List = () => {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navigation />
      <ListView />
      <BottomNavigation />
    </div>
  );
};

export default List;
