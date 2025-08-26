
import React from 'react';
import MapView from '../components/MapView';
import TicketmasterToggle from '@/components/events/TicketmasterToggle';
import { Sparkles, MapPin } from 'lucide-react';

const Home = () => {

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Simple Header with Logo */}
      <div className="absolute top-4 left-4 z-50 flex items-center">
        <img 
          src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
          alt="Lo Logo" 
          className="h-12 drop-shadow-lg"
        />
        <Sparkles className="w-6 h-6 text-teal-500 ml-2 animate-pulse" />
      </div>
      
      {/* Main Map View */}
      <MapView />

      {/* Ticketmaster Events Toggle */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <TicketmasterToggle className="animate-fade-in" />
      </div>


    </div>
  );
};

export default Home;
