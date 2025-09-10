
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mockMessages } from '@/mock/messages';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Message } from '@/types/database';

interface Filters {
  showPublic: boolean;
  showFollowers: boolean;
}

export const useMessages = () => {
  const [filters, setFilters] = useState<Filters>({
    showPublic: true,
    showFollowers: true,
  });
  const [messages, setMessages] = useState(mockMessages);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const addMessage = (newMessage: any) => {
    console.log('📍 useMessages: Adding message to state:', {
      id: newMessage.id,
      position: newMessage.position,
      content: newMessage.content?.substring(0, 50)
    });
    setMessages(prev => {
      const updated = [newMessage, ...prev];
      console.log(`✅ Total messages after adding: ${updated.length}`);
      return updated;
    });
  };

  const updateMessage = (id: string, updates: any) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const fetchMessages = async (searchQuery?: string) => {
    console.log('🔄 Fetching messages from database...');
    try {
      setLoading(true);
      
      // Fetch regular messages including events
      // Include messages from the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      let messageQuery = supabase
        .from('messages')
        .select('*')
        .or(`expires_at.gte.${new Date().toISOString()},created_at.gte.${oneDayAgo}`)
        .order('created_at', { ascending: false });

      // Apply search filter if provided
      if (searchQuery && searchQuery.trim()) {
        messageQuery = messageQuery.or(`content.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data: messagesData, error: messagesError } = await messageQuery;

      // Fetch events data (try to fetch but don't fail if table doesn't exist yet)
      let eventsData = null;
      try {
        let eventsQuery = supabase
          .from('events')
          .select('*')
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true });

        // Apply search filter to events if provided
        if (searchQuery && searchQuery.trim()) {
          eventsQuery = eventsQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,venue_name.ilike.%${searchQuery}%`);
        }

        const { data: eventResults } = await eventsQuery;
        eventsData = eventResults;
      } catch (eventsError) {
        console.warn('Events table not accessible yet:', eventsError);
      }

      if (messagesError) throw messagesError;

      console.log(`📦 Fetched ${messagesData?.length || 0} messages from database`);
      
      let allMessages = [];

      // Process regular messages
      if (messagesData) {
        const transformedMessages = messagesData.map((message: any) => {
          // Check if this is an event post - use message_type field or content patterns
          const isEvent = message.message_type === 'event' || 
                         message.content?.includes('🎫') || 
                         message.content?.includes('#Events') ||
                         (message.content?.includes('📅') && message.content?.includes('📍'));

          // For Ticketmaster events, use special display properties
          if (message.message_type === 'event' && message.event_source === 'ticketmaster') {
            return {
              id: message.id,
              content: message.content,
              mediaUrl: message.media_url,
              isPublic: message.is_public,
              location: message.location,
              timestamp: message.created_at,
              expiresAt: message.expires_at,
              user: {
                name: '🎫 Ticketmaster Events',
                avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
              },
              position: {
                x: message.lat,
                y: message.lng
              },
              liked: user ? message.likes?.some((like: any) => like.user_id === user.id) : false,
              likes: message.likes?.length || 0,
              isEvent: true,
              eventData: {
                title: message.event_title,
                venue: message.event_venue,
                url: message.event_url,
                startDate: message.event_start_date,
                priceMin: message.event_price_min,
                priceMax: message.event_price_max,
                source: message.event_source
              }
            };
          }

          return {
            id: message.id,
            content: message.content,
            mediaUrl: message.media_url,
            isPublic: message.is_public,
            location: message.location,
            timestamp: message.created_at,
            expiresAt: message.expires_at,
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
            isEvent: isEvent
          };
        });
        allMessages.push(...transformedMessages);
      }

      // Process events as messages if available
      if (eventsData) {
        const eventMessages = eventsData.map((event: any) => ({
          id: `event-${event.id}`,
          content: `🎫 ${event.title}\n\n📍 ${event.venue_name}${event.venue_address ? `\n${event.venue_address}` : ''}\n\n📅 ${new Date(event.start_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}\n\n${event.description ? `${event.description.slice(0, 200)}${event.description.length > 200 ? '...' : ''}\n\n` : ''}${event.price_min ? `💰 From $${event.price_min}\n\n` : ''}🔗 ${event.event_url}\n\n#Events #${event.source === 'eventbrite' ? 'Eventbrite' : 'Ticketmaster'}`,
          mediaUrl: event.image_url,
          isPublic: true,
          location: event.venue_address || event.venue_name,
          timestamp: event.created_at,
          expiresAt: event.start_date,
          user: {
            name: `${event.source === 'eventbrite' ? 'Eventbrite' : 'Ticketmaster'} Events`,
            avatar: event.source === 'eventbrite' ? 'https://cdn.evbstatic.com/s3-build/fe/build/images/logos/eb-orange-wordmark-no-text.6f6804bb.svg' : 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
          },
          position: {
            x: event.lat,
            y: event.lng
          },
          liked: false,
          likes: 0,
          isEvent: true,
          eventData: event
        }));
        allMessages.push(...eventMessages);
      }

      // Sort all messages by timestamp
      allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setMessages(allMessages);

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      
      // Don't overwrite existing messages on error - keep what we have
      // Only use mock data if we have no messages at all
      if (messages.length === 0) {
        // Update mock messages to ensure they have the proper avatar URLs
        const updatedMockMessages = mockMessages.map(message => {
          // Ensure we have a valid avatar URL
          const userAvatar = message.user?.avatar || user?.user_metadata?.avatar_url || '/placeholder.svg';
          
          return {
            ...message,
            user: {
              ...message.user,
              avatar: userAvatar
            }
          };
        });
        
        // Fall back to updated mock data only if no messages exist
        setMessages(updatedMockMessages);
      }
      
      // Only show error toast for actual network/connection errors, not for empty results
      if (error.message && !error.message.includes('JWT') && !error.message.includes('auth')) {
        // Silently handle auth-related errors and empty results
        console.log('Using existing messages while database connection fails...');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchMessages = (query: string) => {
    fetchMessages(query);
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        console.log('📡 Real-time update received, fetching messages...');
        fetchMessages();
      })
      .subscribe();
    
    // Listen for manual refresh events
    const handleRefresh = () => {
      console.log('🔄 Manual refresh triggered, fetching messages...');
      fetchMessages();
    };
    window.addEventListener('refreshMessages', handleRefresh);
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('refreshMessages', handleRefresh);
    };
  }, [user?.id]);

  const handleFilterChange = (type: 'showPublic' | 'showFollowers', checked: boolean) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  };

  const filteredMessages = messages.filter(message => {
    const shouldShow = (message.isPublic && filters.showPublic) || (!message.isPublic && filters.showFollowers);
    if (!shouldShow && messages.length > 0) {
      console.log(`🚫 Message filtered out:`, message.id, 'isPublic:', message.isPublic, 'filters:', filters);
    }
    return shouldShow;
  });
  
  console.log(`📊 Filtered messages: ${filteredMessages.length} / ${messages.length} total`);

  return {
    filters,
    filteredMessages,
    messages,
    addMessage,
    updateMessage,
    handleFilterChange,
    searchMessages,
    loading,
    refreshMessages: fetchMessages
  };
};
