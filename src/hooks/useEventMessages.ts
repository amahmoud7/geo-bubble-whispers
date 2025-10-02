import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface EventMessage {
  id: string;
  content: string;
  media_url?: string;
  location?: string;
  lat?: number;
  lng?: number;
  event_source: string;
  external_event_id: string;
  event_url?: string;
  event_title: string;
  event_venue?: string;
  event_start_date: string;
  event_price_min?: number;
  event_price_max?: number;
  created_at: string;
  expires_at?: string;
}

export const useEventMessages = () => {
  const {
    data: events = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['event-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          media_url,
          location,
          lat,
          lng,
          event_source,
          external_event_id,
          event_url,
          event_title,
          event_venue,
          event_start_date,
          event_price_min,
          event_price_max,
          created_at,
          expires_at
        `)
        .eq('message_type', 'event')
        .gt('expires_at', new Date().toISOString())
        // Allow events that started up to 4 hours ago (for testing)
        .gte('event_start_date', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
        .order('event_start_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching event messages:', error);
        throw error;
      }

      console.log(`📋 Loaded ${data?.length || 0} event messages from database`);
      if (data?.length > 0) {
        console.log('🎫 Event messages:', data.map(e => `${e.event_title} at ${e.event_venue}`));
      }

      return data as EventMessage[];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Trigger Ticketmaster fetch
  const fetchTicketmasterEvents = async () => {
    try {
      console.log('🎫 Starting Ticketmaster event fetch (top 10 events)...');
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: { source: 'ticketmaster' }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      console.log('✅ Ticketmaster fetch response:', data);
      
      // Refetch the events after successful fetch
      console.log('🔄 Refetching events from database...');
      refetch();
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching Ticketmaster events:', error);
      throw error;
    }
  };

  // Get events starting within specified hours
  const getEventsStartingWithin = (hours: number) => {
    const cutoffTime = new Date(Date.now() + hours * 60 * 60 * 1000);
    return events.filter(event => 
      new Date(event.event_start_date) <= cutoffTime
    );
  };

  // Get events by location proximity
  const getEventsByLocation = (userLat: number, userLng: number, radiusMiles = 10) => {
    return events.filter(event => {
      if (!event.lat || !event.lng) return false;
      
      // Simple distance calculation (rough approximation)
      const latDiff = Math.abs(event.lat - userLat);
      const lngDiff = Math.abs(event.lng - userLng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      // Rough conversion: 1 degree ≈ 69 miles
      return distance * 69 <= radiusMiles;
    });
  };

  return {
    events,
    isLoading,
    error,
    refetch,
    fetchTicketmasterEvents,
    getEventsStartingWithin,
    getEventsByLocation,
    // Convenience getters
    eventsStartingSoon: getEventsStartingWithin(2), // Within 2 hours
    eventsToday: getEventsStartingWithin(24), // Within 24 hours
  };
};

export const useEventMessage = (eventId: string) => {
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event-message', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          media_url,
          location,
          lat,
          lng,
          event_source,
          external_event_id,
          event_url,
          event_title,
          event_venue,
          event_start_date,
          event_price_min,
          event_price_max,
          created_at,
          expires_at
        `)
        .eq('id', eventId)
        .eq('message_type', 'event')
        .single();

      if (error) {
        console.error('Error fetching event message:', error);
        throw error;
      }

      return data as EventMessage;
    },
    enabled: !!eventId,
  });

  return { event, isLoading, error };
};