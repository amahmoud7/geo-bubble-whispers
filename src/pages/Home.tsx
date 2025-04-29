
import React from 'react';
import Navigation from '../components/Navigation';
import MapView from '../components/MapView';
import { toast } from '@/hooks/use-toast';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <MapView />
    </div>
  );
};

export default Home;
