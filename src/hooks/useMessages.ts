
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
    setMessages(prev => [newMessage, ...prev]);
  };

  const updateMessage = (id: string, updates: any) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const fetchMessages = async (searchQuery?: string) => {
    try {
      setLoading(true);
      
      // Fetch regular messages
      let messageQuery = supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (name, username, avatar_url),
          likes:likes (user_id)
        `)
        .gte('expires_at', new Date().toISOString())
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

      let allMessages = [];

      // Process regular messages
      if (messagesData) {
        const transformedMessages = messagesData.map((message: any) => ({
          id: message.id,
          content: message.content,
          mediaUrl: message.media_url,
          isPublic: message.is_public,
          location: message.location,
          timestamp: message.created_at,
          expiresAt: message.expires_at,
          user: {
            name: message.profiles?.name || 'Unknown User',
            avatar: message.profiles?.avatar_url || '/placeholder.svg'
          },
          position: {
            x: message.lat,
            y: message.lng
          },
          // Check if current user has liked this message
          liked: user ? message.likes?.some((like: any) => like.user_id === user.id) : false,
          // Count of likes
          likes: message.likes?.length || 0,
          isEvent: false
        }));
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
          })}\n\n${event.description ? `${event.description.slice(0, 200)}${event.description.length > 200 ? '...' : ''}\n\n` : ''}${event.price_min ? `💰 From $${event.price_min}\n\n` : ''}🔗 ${event.event_url}\n\n#Events #LA #${event.source === 'eventbrite' ? 'Eventbrite' : 'Ticketmaster'}`,
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
      
      // Fall back to updated mock data
      setMessages(updatedMockMessages);
      
      toast({
        title: "Error loading messages",
        description: "Using sample data instead",
        variant: "destructive"
      });
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
        fetchMessages();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleFilterChange = (type: 'showPublic' | 'showFollowers', checked: boolean) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  };

  const filteredMessages = messages.filter(message => {
    if (message.isPublic && filters.showPublic) return true;
    if (!message.isPublic && filters.showFollowers) return true;
    return false;
  });

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
