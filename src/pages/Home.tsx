
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

      {/* Events Info Card */}
      <div className="absolute top-20 left-4 z-40 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-xs">
        <div className="flex items-center mb-2">
          <Sparkles className="w-5 h-5 text-teal-600 mr-2" />
          <h3 className="font-bold text-gray-800">LA Events</h3>
        </div>
        <p className="text-sm text-gray-600">
          Toggle the button below to show all Ticketmaster events happening in Los Angeles in the next 24 hours. 
          Events appear as Lo messages at venue locations!
        </p>
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
            🎫 24-Hour Events
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
