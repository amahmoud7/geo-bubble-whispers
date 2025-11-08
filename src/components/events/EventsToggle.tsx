import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, MapPin, ExternalLink, Clock, Copy, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEventMessages } from '@/hooks/useEventMessages';
import { useMapContext } from '@/contexts/EnhancedMapContext';
import { useMapCityDetection } from '@/hooks/useMapCityDetection';
import { formatCityDisplay, type City } from '@/utils/cityDetection';
import { debugLogger } from '@/utils/debugLogger';

interface EventsToggleProps {
  className?: string;
  onEventsOnlyModeChange?: (enabled: boolean) => void;
}

const EventsToggle: React.FC<EventsToggleProps> = ({ className = '', onEventsOnlyModeChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [eventsVisible, setEventsVisible] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [isEventsOnlyMode, setIsEventsOnlyMode] = useState(false);
  const { events, refetch } = useEventMessages();
  const { map } = useMapContext();
  const { currentCity, isWithinRange, mapCenter } = useMapCityDetection(map);

  // City detection now handled by useMapCityDetection hook
  // This automatically detects the city based on map center position

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
    if (eventsVisible && isEventsOnlyMode) {
      await clearEvents();
      setIsEventsOnlyMode(false);
      setEventsVisible(false);
      setEventCount(0);
      onEventsOnlyModeChange?.(false);
      
      toast({
        title: "🗺️ Map Restored",
        description: "All content is now visible on the map",
        duration: 2000,
      });
    } else {
      setIsEventsOnlyMode(true);
      onEventsOnlyModeChange?.(true);
      
      // Clear existing events first, then load new ones for current city
      if (eventsVisible) {
        await clearEvents();
        setTimeout(() => loadEvents(), 500); // Small delay to ensure clearing completes
      } else {
        await loadEvents();
      }
    }
  };

  const loadEvents = async () => {
    // Use city detection if available, otherwise use map center or default to LA
    let center = currentCity?.coordinates;
    let radius = currentCity?.radius || 50;
    let locationName = currentCity?.displayName;

    if (!center && mapCenter) {
      center = mapCenter;
      locationName = 'Current location';
      console.log('📍 Using map center:', center);
    }

    if (!center) {
      // Default to LA if no location available
      center = { lat: 34.0522, lng: -118.2437 };
      locationName = 'Los Angeles';
      console.log('📍 Using default location (LA)');
    }

    console.log(`🎫 Fetching events for ${locationName} (${center.lat}, ${center.lng}) radius: ${radius}mi`);

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: { 
          source: ['ticketmaster', 'eventbrite'],
          center: center,
          radius: radius,
          timeframe: '24h'
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      console.log('✅ Events fetch response:', data);
      
      // Refresh events to show on map
      console.log('🔄 Refetching events from database...');
      await refetch();
      
      // Mark events as visible
      const eventCount = data?.events?.total || data?.events?.created || data?.totalEvents || 0;
      setEventsVisible(true);
      setEventCount(eventCount);
      
      toast({
        title: `🎫 ${locationName} Events Loaded!`,
        description: `Showing ${eventCount} events • Other content hidden`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('Error loading events:', error);
      
      if (error.message?.includes('Edge Function returned a non-2xx status code') || 
          error.message?.includes('NOT_FOUND')) {
        toast({
          title: "🔧 Setup Required",
          description: "Please deploy the events function. Check console for instructions.",
          duration: 5000,
        });
        
      console.info(`
🔧 EVENTS SETUP REQUIRED:

The events function needs to be deployed:

1. Deploy function: supabase functions deploy fetch-events-realtime
2. Set environment variables:
   - TICKETMASTER_API_KEY=your_api_key
   - EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_token
   - SUPABASE_SERVICE_ROLE_KEY=your_service_key
3. Ensure database migration is applied

See REALTIME_EVENTS_SETUP.md for detailed instructions.
        `);
      } else {
        toast({
          title: "❌ Connection Error",
          description: "Failed to connect to event services. Please try again.",
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
      console.log('🧹 Clearing all events...');
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('message_type', 'event')
        .in('event_source', ['ticketmaster', 'seatgeek', 'predicthq', 'yelp', 'eventbrite', 'meetup']);

      if (error) {
        throw error;
      }

      // Refresh events to update map
      await refetch();
      
      toast({
        title: "🧹 Events Hidden",
        description: "All events have been removed from the map",
        duration: 2000,
      });

    } catch (error: any) {
      console.error('Error clearing events:', error);
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
      {/* Compact Toggle Button with Liquid Glass UI */}
      <button
        onClick={handleToggleEvents}
        disabled={isLoading}
        className={`
          relative flex min-h-[36px] min-w-[80px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold text-white transition-transform duration-200
          backdrop-blur-xl
          ${eventsVisible && isEventsOnlyMode
            ? 'bg-gradient-to-r from-purple-600/30 to-indigo-500/30 border-purple-400/40'
            : eventsVisible 
            ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-400/40'
            : 'bg-gradient-to-r from-amber-400/30 to-yellow-400/30 border-amber-300/40'
          }
          ${isLoading ? 'scale-95 opacity-80' : 'hover:scale-[1.02] active:scale-95'}
          disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60
        `}
      >
        {/* Animated Background */}
        {eventsVisible && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        )}
        
        <div className="relative flex items-center space-x-1">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : eventsVisible ? (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full motion-safe:animate-pulse"></div>
              <Calendar className="w-3 h-3" />
            </div>
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          
          <span className="text-xs leading-tight font-semibold">
            {isLoading 
              ? 'Loading' 
              : eventsVisible && isEventsOnlyMode
              ? 'Exit'
              : eventsVisible 
              ? 'Only' 
              : 'Events'
            }
          </span>
        </div>
      </button>

      
    </div>
  );
};

export default EventsToggle;
