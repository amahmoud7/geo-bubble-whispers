
import React from 'react';
import Navigation from '../components/Navigation';
import ListView from '../components/ListView';

const List = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <ListView />
    </div>
  );
};

export default List;
