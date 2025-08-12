import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, MapPin, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEventMessages } from '@/hooks/useEventMessages';

interface TicketmasterToggleProps {
  className?: string;
}

const TicketmasterToggle: React.FC<TicketmasterToggleProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [eventsVisible, setEventsVisible] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const { events, refetch } = useEventMessages();

  // Check if events are currently displayed on map
  useEffect(() => {
    const currentEvents = events.filter(event => {
      const eventTime = new Date(event.event_start_date);
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return eventTime >= now && eventTime <= twentyFourHoursFromNow;
    });
    
    setEventsVisible(currentEvents.length > 0);
    setEventCount(currentEvents.length);
  }, [events]);

  const handleToggleEvents = async () => {
    if (eventsVisible) {
      // Hide events by clearing them
      await clearEvents();
    } else {
      // Show events by fetching from Ticketmaster
      await loadEvents();
    }
  };

  const loadEvents = async () => {
    setIsLoading(true);
    
    try {
      console.log('🎫 Loading Ticketmaster events for next 24 hours...');
      
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: { 
          source: 'ticketmaster',
          location: 'los-angeles',
          radius: 25,
          timeframe: '24h'
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Events loaded successfully:', data);
      
      // Refresh events to show on map
      await refetch();
      
      toast({
        title: "🎫 Events Loaded!",
        description: `Found ${data?.totalEvents || 0} Ticketmaster events in LA for the next 24 hours`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('❌ Error loading events:', error);
      
      if (error.message?.includes('Edge Function returned a non-2xx status code') || 
          error.message?.includes('NOT_FOUND')) {
        toast({
          title: "🔧 Setup Required",
          description: "Please deploy the Ticketmaster function. Check console for instructions.",
          duration: 5000,
        });
        
        console.log(`
🔧 TICKETMASTER SETUP REQUIRED:

The Ticketmaster events function needs to be deployed:

1. Deploy function: supabase functions deploy fetch-events-realtime
2. Set environment variables:
   - TICKETMASTER_API_KEY=your_api_key
   - SUPABASE_SERVICE_ROLE_KEY=your_service_key
3. Ensure database migration is applied

See REALTIME_EVENTS_SETUP.md for detailed instructions.
        `);
      } else {
        toast({
          title: "❌ Connection Error",
          description: "Failed to connect to Ticketmaster. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearEvents = async () => {
    setIsLoading(true);
    
    try {
      console.log('🧹 Clearing Ticketmaster events...');
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('message_type', 'event')
        .eq('event_source', 'ticketmaster');

      if (error) {
        throw error;
      }

      // Refresh events to update map
      await refetch();
      
      toast({
        title: "🧹 Events Hidden",
        description: "Ticketmaster events have been removed from the map",
        duration: 2000,
      });

    } catch (error: any) {
      console.error('❌ Error clearing events:', error);
      toast({
        title: "❌ Clear Error",
        description: "Failed to clear events from map",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Main Toggle Button */}
      <Button
        onClick={handleToggleEvents}
        disabled={isLoading}
        className={`
          relative min-w-[220px] h-16 text-lg font-bold rounded-2xl transition-all duration-300 shadow-2xl
          ${eventsVisible 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
            : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black'
          }
          ${isLoading ? 'scale-95 opacity-90' : 'hover:scale-105 active:scale-95'}
          border-2 ${eventsVisible ? 'border-green-300' : 'border-yellow-300'}
        `}
      >
        {/* Animated Background */}
        {eventsVisible && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-2xl"></div>
        )}
        
        <div className="relative flex items-center space-x-3">
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : eventsVisible ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <Calendar className="w-6 h-6" />
            </div>
          ) : (
            <Calendar className="w-7 h-7" />
          )}
          
          <div className="flex flex-col items-start">
            <span className="text-base leading-tight">
              {isLoading ? 'Loading...' : eventsVisible ? 'Hide Events' : 'Show Events'}
            </span>
            <span className="text-sm opacity-90 leading-tight">
              {eventsVisible ? `${eventCount} Live Events` : 'Next 24 Hours'}
            </span>
          </div>
          
          {!isLoading && <ExternalLink className="w-5 h-5 ml-2" />}
        </div>
      </Button>

      {/* Status Information */}
      {eventsVisible && (
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">{eventCount} Active</span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Next 24h</span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>LA Area</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!eventsVisible && !isLoading && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Click to load all Ticketmaster events happening in Los Angeles in the next 24 hours
        </p>
      )}
    </div>
  );
};

export default TicketmasterToggle;