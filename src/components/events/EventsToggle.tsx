import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, MapPin, ExternalLink, Clock, Copy, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEventMessages } from '@/hooks/useEventMessages';
import { useMapContext } from '@/contexts/MapContext';
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
    console.log('🎫 BUTTON CLICKED: Toggle events button pressed');
    console.log('🎫 BUTTON STATE: eventsVisible =', eventsVisible);
    console.log('🎫 BUTTON STATE: isEventsOnlyMode =', isEventsOnlyMode);
    console.log('🎫 BUTTON STATE: currentCity =', currentCity);
    console.log('🎫 BUTTON STATE: mapCenter =', mapCenter);
    
    if (eventsVisible && isEventsOnlyMode) {
      // Exit events-only mode - clear events and re-enable other content
      console.log('🎫 BUTTON ACTION: Exiting events-only mode');
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
      // Enter events-only mode - clear other content and load events
      console.log('🎫 BUTTON ACTION: Entering events-only mode - clearing other content');
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
    if (!currentCity) {
      toast({
        title: "📍 Location Required",
        description: "Detecting your location to find nearby events...",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`🎫 EVENTS DEBUG: Loading events for ${currentCity.displayName} (${currentCity.id})`);
      console.log(`🎫 EVENTS DEBUG: Request parameters:`, {
        source: ['ticketmaster', 'predicthq'],
        center: currentCity.coordinates,
        radius: currentCity.radius,
        timeframe: '24h'
      });
      
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: { 
          source: ['ticketmaster', 'predicthq'],
          center: currentCity.coordinates,
          radius: currentCity.radius,
          timeframe: '24h'
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Events loaded successfully:', data);
      
      // Log detailed source information
      if (data?.sources) {
        console.log('📊 SOURCE BREAKDOWN:');
        console.log('  Processed:', data.sources.processed);
        console.log('  Failed:', data.sources.failed);
        
        if (data.sources.processed?.includes('ticketmaster')) {
          console.log('  ✅ Ticketmaster: Success');
        } else {
          console.log('  ❌ Ticketmaster: Failed or not processed');
        }
        
        if (data.sources.processed?.includes('seatgeek')) {
          console.log('  ✅ SeatGeek: Success');
        } else {
          console.log('  ❌ SeatGeek: Failed or not processed');
        }
        
        if (data.sources.processed?.includes('predicthq')) {
          console.log('  ✅ PredictHQ: Success');
        } else {
          console.log('  ❌ PredictHQ: Failed or not processed');
        }
        
        if (data.sources.processed?.includes('yelp')) {
          console.log('  ✅ Yelp: Success');
        } else {
          console.log('  ❌ Yelp: Failed or not processed');
        }
      }
      
      if (data?.events) {
        console.log('📈 EVENTS BREAKDOWN:');
        console.log(`  Total: ${data.events.total || 0}`);
        console.log(`  Created: ${data.events.created || 0}`);
        console.log(`  Updated: ${data.events.updated || 0}`);
        console.log(`  Skipped: ${data.events.skipped || 0}`);
      }
      
      // Refresh events to show on map
      await refetch();
      
      // Mark events as visible
      setEventsVisible(true);
      setEventCount(data?.events?.total || data?.totalEvents || 0);
      
      toast({
        title: `🎫 ${formatCityDisplay(currentCity)} Events Only!`,
        description: `Showing ${data?.events?.total || data?.totalEvents || 0} events in ${currentCity.displayName} • Other content hidden for better performance`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('❌ Error loading events:', error);
      
      if (error.message?.includes('Edge Function returned a non-2xx status code') || 
          error.message?.includes('NOT_FOUND')) {
        toast({
          title: "🔧 Setup Required",
          description: "Please deploy the events function. Check console for instructions.",
          duration: 5000,
        });
        
        console.log(`
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
        .in('event_source', ['ticketmaster', 'seatgeek', 'predicthq', 'yelp', 'eventbrite']);

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
      {/* Main Toggle Button with Liquid Glass UI */}
      <button
        onClick={handleToggleEvents}
        disabled={isLoading}
        className={`
          relative min-w-[220px] h-16 text-lg font-bold glass-card transition-all duration-300 glass-float
          ${eventsVisible && isEventsOnlyMode
            ? 'text-purple-300' 
            : eventsVisible 
            ? 'text-green-400' 
            : 'text-yellow-400'
          }
          ${isLoading ? 'scale-95 opacity-90' : 'hover:scale-105 active:scale-95'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{
          background: eventsVisible && isEventsOnlyMode
            ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)'
            : eventsVisible 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${eventsVisible && isEventsOnlyMode ? 'rgba(147, 51, 234, 0.3)' : eventsVisible ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}
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
              {isLoading 
                ? 'Loading...' 
                : eventsVisible && isEventsOnlyMode
                ? 'Exit Events Mode'
                : eventsVisible 
                ? 'Events Only Mode' 
                : 'Show Events'
              }
            </span>
            <span className="text-sm opacity-90 leading-tight">
              {eventsVisible && isEventsOnlyMode
                ? `Events Only • ${eventCount} Found`
                : eventsVisible 
                ? `${eventCount} Live Events` 
                : currentCity 
                  ? `${currentCity.displayName} • 24h`
                  : 'Next 24 Hours'
              }
            </span>
          </div>
          
          {!isLoading && <ExternalLink className="w-5 h-5 ml-2" />}
        </div>
      </button>

      {/* Status Information with Liquid Glass */}
      {eventsVisible && (
        <div className="glass px-4 py-2 rounded-2xl flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium text-white">{eventCount} Active</span>
          </div>
          
          <div className="flex items-center space-x-1 text-white/80">
            <Clock className="w-4 h-4" />
            <span>Next 24h</span>
          </div>
          
          <div className="flex items-center space-x-1 text-white/80">
            <MapPin className="w-4 h-4" />
            <span>{currentCity?.displayName || 'No City'}</span>
          </div>
        </div>
      )}

      {/* Location Detection Status */}
      {!isWithinRange && currentCity && (
        <div className="text-xs text-amber-600 text-center max-w-xs">
          📍 You're outside major cities - showing {currentCity.displayName} events</div>
      )}

      {/* City Detection Loading */}
      {!currentCity && map && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Detecting city from map...</span>
        </div>
      )}

      {/* Instructions */}
      {!eventsVisible && !isLoading && currentCity && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Move map to any major city • Tap to show live events for {formatCityDisplay(currentCity)}
        </p>
      )}
      
      {/* Debug Tools - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex items-center space-x-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              debugLogger.copyToClipboard();
              toast({
                title: "📋 Logs Copied!",
                description: "Debug logs copied to clipboard - paste them to share",
                duration: 2000,
              });
            }}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Logs
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              debugLogger.downloadLogs();
              toast({
                title: "📥 Logs Downloaded!",
                description: "Debug logs saved to file",
                duration: 2000,
              });
            }}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventsToggle;