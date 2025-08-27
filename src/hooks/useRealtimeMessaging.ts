import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DirectMessage, Conversation, UserPresence, MessageReaction } from './useDirectMessaging';

export const useRealtimeMessaging = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up real-time subscriptions for messaging
  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Subscribe to new direct messages
    const messagesChannel = supabase
      .channel('direct_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          // Update conversation messages cache
          queryClient.setQueryData(
            ['conversation-messages', newMessage.conversation_id],
            (oldData: DirectMessage[] | undefined) => {
              if (!oldData) return [newMessage];
              return [...oldData, newMessage];
            }
          );

          // Invalidate conversations list to update last message
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });

          // Play notification sound for messages from others
          if (newMessage.sender_id !== user.id) {
            playMessageSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const updatedMessage = payload.new as DirectMessage;
          
          // Update conversation messages cache
          queryClient.setQueryData(
            ['conversation-messages', updatedMessage.conversation_id],
            (oldData: DirectMessage[] | undefined) => {
              if (!oldData) return [updatedMessage];
              return oldData.map(msg => 
                msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
              );
            }
          );
        }
      )
      .subscribe();

    channels.push(messagesChannel);

    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1_id=eq.${user.id},participant_2_id=eq.${user.id}`,
        },
        () => {
          // Invalidate conversations list when any conversation changes
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    channels.push(conversationsChannel);

    // Subscribe to message reactions
    const reactionsChannel = supabase
      .channel('message_reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          // Invalidate all conversation messages to refresh reactions
          queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
        }
      )
      .subscribe();

    channels.push(reactionsChannel);

    // Subscribe to message status updates
    const statusChannel = supabase
      .channel('message_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_status',
        },
        () => {
          // Invalidate conversation messages to refresh read receipts
          queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    channels.push(statusChannel);

    // Subscribe to user presence updates
    const presenceChannel = supabase
      .channel('user_presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          // Invalidate user presence data
          queryClient.invalidateQueries({ queryKey: ['user-presence', user.id] });
        }
      )
      .subscribe();

    channels.push(presenceChannel);

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, queryClient]);

  // Update presence when user comes online/offline
  useEffect(() => {
    if (!user) return;

    const updatePresence = async (isOnline: boolean) => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    };

    // Set online when component mounts
    updatePresence(true);

    // Set offline when page is about to unload
    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    // Set offline when page becomes hidden
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };

    // Update presence periodically to keep it fresh
    const presenceInterval = setInterval(() => {
      if (!document.hidden) {
        updatePresence(true);
      }
    }, 30000); // Update every 30 seconds

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence(false);
    };
  }, [user]);

  // Typing indicator functionality
  const setTypingIndicator = useCallback(async (conversationId: string | null) => {
    if (!user) return;

    await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        is_typing_in_conversation: conversationId,
        updated_at: new Date().toISOString(),
      });
  }, [user]);

  // Play message notification sound
  const playMessageSound = useCallback(() => {
    // Create a subtle notification sound
    try {
      const audio = new Audio();
      // Use a data URL for a short beep sound to avoid external dependencies
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuZ4/LNeSsFJHfB8dyKNwkZa7Xo6qBOEwlUp+PyQBkKE2Wz7Oh9JwcheMhy';
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors - browser may block autoplay
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  return {
    setTypingIndicator,
    playMessageSound,
  };
};