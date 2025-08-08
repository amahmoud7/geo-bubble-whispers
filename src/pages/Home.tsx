
import React, { useState } from 'react';
import MapView from '../components/MapView';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Home = () => {
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const handleFetchTicketmasterEvents = async () => {
    setIsLoadingEvents(true);
    
    try {
      console.log('🎫 Fetching Ticketmaster events for Los Angeles...');
      
      const { data, error } = await supabase.functions.invoke('fetch-events-24h', {
        body: { source: 'ticketmaster' }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Ticketmaster events fetched successfully:', data);
      
      toast({
        title: "🎫 Ticketmaster Events Loaded!",
        description: `Found ${data?.totalEvents || 0} events, created ${data?.newEvents || 0} new event pins on the map`,
      });

      if (data?.newEvents > 0) {
        // Reload the page after a short delay to show new event pins
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

    } catch (error: any) {
      console.error('❌ Error fetching Ticketmaster events:', error);
      toast({
        title: "Error Loading Events",
        description: error.message || "Failed to fetch Ticketmaster events",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

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

      {/* Ticketmaster Events Button - Positioned prominently */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={handleFetchTicketmasterEvents}
          disabled={isLoadingEvents}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-400"
        >
          {isLoadingEvents ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              Loading LA Events...
            </>
          ) : (
            <>
              <Calendar className="w-6 h-6 mr-3" />
              Load Ticketmaster Events
              <ExternalLink className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Simple Info Card */}
      <div className="absolute top-20 left-4 z-40 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-xs">
        <div className="flex items-center mb-2">
          <MapPin className="w-5 h-5 text-teal-600 mr-2" />
          <h3 className="font-bold text-gray-800">Los Angeles Events</h3>
        </div>
        <p className="text-sm text-gray-600">
          Click the button below to load live Ticketmaster events happening in LA. 
          Gold markers will appear at event venues with direct links to buy tickets!
        </p>
      </div>
    </div>
  );
};

export default Home;
