
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mockMessages } from '@/mock/messages';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Construct query based on filters
      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (name, username, avatar_url),
          likes:likes (user_id)
        `)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Transform data to match our app's expected format
        const transformedMessages = data.map(message => ({
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
          liked: user ? message.likes.some((like: any) => like.user_id === user.id) : false,
          // Count of likes
          likes: message.likes.length
        }));
        
        setMessages(transformedMessages);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      // Fall back to mock data
      setMessages(mockMessages);
      
      toast({
        title: "Error loading messages",
        description: "Using sample data instead",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
    handleFilterChange,
    loading,
    refreshMessages: fetchMessages
  };
};
