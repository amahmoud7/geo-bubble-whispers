// Optimized Messages Hook with Spatial Performance
// Leverages new PostGIS functions for sub-100ms query performance

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Filters {
  showPublic: boolean;
  showFollowers: boolean;
}

interface LocationBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MessageLocation {
  lat: number;
  lng: number;
}

interface OptimizedMessage {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  location: string;
  lat: number;
  lng: number;
  userId: string;
  isPublic: boolean;
  timestamp: string;
  expiresAt?: string;
  messageType?: string;
  eventData?: any;
  distance?: number; // Distance in meters from user location
  user: {
    name: string;
    avatar: string;
  };
  position: {
    x: number;
    y: number;
  };
  liked: boolean;
  likes: number;
  isEvent: boolean;
}

export const useOptimizedMessages = () => {
  const [filters, setFilters] = useState<Filters>({
    showPublic: true,
    showFollowers: true,
  });
  const [messages, setMessages] = useState<OptimizedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastQuery, setLastQuery] = useState<string>('');
  const { user } = useAuth();

  // Performance monitoring
  const logQueryPerformance = useCallback(async (
    queryType: string,
    executionTimeMs: number,
    rowsReturned: number,
    searchParams?: any
  ) => {
    try {
      await supabase.rpc('capture_query_performance', {
        query_text: `${queryType} query with params: ${JSON.stringify(searchParams || {})}`,
        query_type_param: queryType,
        execution_time_ms: executionTimeMs,
        rows_returned: rowsReturned,
        request_id_param: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    } catch (error) {
      console.warn('Failed to log query performance:', error);
    }
  }, []);

  // Optimized proximity-based message fetching
  const fetchNearbyMessages = useCallback(async (
    userLocation: MessageLocation,
    radiusMeters: number = 1000,
    messageLimit: number = 100,
    searchQuery?: string
  ) => {
    const startTime = performance.now();
    try {
      setLoading(true);
      
      // Use optimized spatial function
      const { data: nearbyData, error } = await supabase
        .rpc('get_nearby_messages', {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          radius_meters: radiusMeters,
          message_limit: messageLimit
        });

      if (error) throw error;

      // Apply search filter client-side if needed (for now)
      let filteredData = nearbyData || [];
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter((msg: any) =>
          msg.content?.toLowerCase().includes(query) ||
          msg.location?.toLowerCase().includes(query) ||
          msg.event_title?.toLowerCase().includes(query)
        );
      }

      // Transform to expected format
      const transformedMessages: OptimizedMessage[] = filteredData.map((message: any) => ({
        id: message.id,
        content: message.content,
        mediaUrl: message.media_url,
        mediaType: message.media_type,
        location: message.location,
        lat: message.lat,
        lng: message.lng,
        userId: message.user_id,
        isPublic: message.is_public,
        timestamp: message.created_at,
        expiresAt: message.expires_at,
        messageType: message.message_type,
        distance: Math.round(message.distance_meters || 0),
        user: {
          name: message.message_type === 'event' ? '🎫 Event' : 'Lo User',
          avatar: message.message_type === 'event' 
            ? 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
            : '/placeholder.svg'
        },
        position: {
          x: message.lat,
          y: message.lng
        },
        liked: false,
        likes: 0,
        isEvent: message.message_type === 'event',
        eventData: message.message_type === 'event' ? {
          title: message.event_title,
          venue: message.event_venue,
          url: message.event_url,
          startDate: message.event_start_date,
          priceMin: message.event_price_min,
          priceMax: message.event_price_max
        } : undefined
      }));

      setMessages(transformedMessages);
      
      const executionTime = performance.now() - startTime;
      await logQueryPerformance('proximity_search', executionTime, transformedMessages.length, {
        radius: radiusMeters,
        location: userLocation,
        searchQuery
      });

      // Show performance toast for development
      if (import.meta.env.DEV && executionTime > 100) {
        toast({
          title: 'Query Performance Warning',
          description: `Proximity search took ${Math.round(executionTime)}ms (target: <100ms)`,
          variant: 'destructive'
        });
      } else if (import.meta.env.DEV) {
        console.log(`✅ Proximity search completed in ${Math.round(executionTime)}ms`);
      }

    } catch (error: any) {
      console.error('Error fetching nearby messages:', error);
      toast({
        title: 'Unable to load nearby messages',
        description: 'Please check your location and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [logQueryPerformance]);

  // Optimized bounds-based message fetching (for map viewport)
  const fetchMessagesInBounds = useCallback(async (
    bounds: LocationBounds,
    messageLimit: number = 200,
    searchQuery?: string
  ) => {
    const startTime = performance.now();
    try {
      setLoading(true);

      // Use optimized bounds function
      const { data: boundsData, error } = await supabase
        .rpc('get_messages_in_bounds', {
          north_lat: bounds.north,
          south_lat: bounds.south,
          east_lng: bounds.east,
          west_lng: bounds.west,
          message_limit: messageLimit
        });

      if (error) throw error;

      // Apply search filter if needed
      let filteredData = boundsData || [];
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter((msg: any) =>
          msg.content?.toLowerCase().includes(query) ||
          msg.location?.toLowerCase().includes(query)
        );
      }

      // Transform to expected format
      const transformedMessages: OptimizedMessage[] = filteredData.map((message: any) => ({
        id: message.id,
        content: message.content,
        mediaUrl: message.media_url,
        mediaType: message.media_type,
        location: message.location,
        lat: message.lat,
        lng: message.lng,
        userId: message.user_id,
        isPublic: message.is_public,
        timestamp: message.created_at,
        expiresAt: message.expires_at,
        messageType: message.message_type,
        user: {
          name: message.message_type === 'event' ? '🎫 Event' : 'Lo User',
          avatar: '/placeholder.svg'
        },
        position: {
          x: message.lat,
          y: message.lng
        },
        liked: false,
        likes: 0,
        isEvent: message.message_type === 'event'
      }));

      setMessages(transformedMessages);
      
      const executionTime = performance.now() - startTime;
      await logQueryPerformance('viewport_bounds', executionTime, transformedMessages.length, {
        bounds,
        searchQuery
      });

      if (import.meta.env.DEV) {
        console.log(`✅ Bounds search completed in ${Math.round(executionTime)}ms`);
      }

    } catch (error: any) {
      console.error('Error fetching messages in bounds:', error);
      toast({
        title: 'Unable to load messages',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [logQueryPerformance]);

  // Legacy fallback method (for backward compatibility)
  const fetchMessages = useCallback(async (searchQuery?: string) => {
    const startTime = performance.now();
    try {
      setLoading(true);
      setLastQuery(searchQuery || '');

      // For now, fall back to regular query if no location available
      // In production, you might want to require location for optimal performance
      let messageQuery = supabase
        .from('messages')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchQuery && searchQuery.trim()) {
        messageQuery = messageQuery.or(`content.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data: messagesData, error } = await messageQuery;
      if (error) throw error;

      const transformedMessages: OptimizedMessage[] = (messagesData || []).map((message: any) => ({
        id: message.id,
        content: message.content,
        mediaUrl: message.media_url,
        mediaType: message.media_type,
        location: message.location,
        lat: message.lat,
        lng: message.lng,
        userId: message.user_id,
        isPublic: message.is_public,
        timestamp: message.created_at,
        expiresAt: message.expires_at,
        messageType: message.message_type,
        user: {
          name: 'Lo User',
          avatar: '/placeholder.svg'
        },
        position: {
          x: message.lat,
          y: message.lng
        },
        liked: false,
        likes: 0,
        isEvent: message.message_type === 'event'
      }));

      setMessages(transformedMessages);
      
      const executionTime = performance.now() - startTime;
      await logQueryPerformance('legacy_fetch', executionTime, transformedMessages.length, { searchQuery });

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Unable to load messages',
        description: 'Please check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [logQueryPerformance]);

  // Add message with automatic spatial indexing
  const addMessage = useCallback((newMessage: any) => {
    setMessages(prev => [newMessage, ...prev]);
  }, []);

  // Update message
  const updateMessage = useCallback((id: string, updates: any) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  // Search messages
  const searchMessages = useCallback((query: string) => {
    setLastQuery(query);
    // Re-fetch with current method
    fetchMessages(query);
  }, [fetchMessages]);

  // Handle filter changes
  const handleFilterChange = useCallback((type: 'showPublic' | 'showFollowers', checked: boolean) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  }, []);

  // Filter messages based on current filters
  const filteredMessages = messages.filter(message => {
    return (message.isPublic && filters.showPublic) || 
           (!message.isPublic && filters.showFollowers);
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('optimized-messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        // Re-fetch with last query
        fetchMessages(lastQuery);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, lastQuery]);

  return {
    // State
    filters,
    messages: filteredMessages,
    allMessages: messages,
    loading,
    
    // Actions
    addMessage,
    updateMessage,
    handleFilterChange,
    searchMessages,
    
    // Optimized methods
    fetchNearbyMessages,
    fetchMessagesInBounds,
    
    // Legacy method
    fetchMessages,
    refreshMessages: fetchMessages
  };
};