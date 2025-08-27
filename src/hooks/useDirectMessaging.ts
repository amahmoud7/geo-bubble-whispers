import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  lat: number | null;
  lng: number | null;
  voice_duration: number | null;
  sender: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  reply_to?: {
    id: string;
    content: string | null;
    media_type: string | null;
    sender: {
      name: string | null;
    };
  };
  reactions?: MessageReaction[];
  status?: MessageStatus[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user: {
    name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageStatus {
  id: string;
  message_id: string;
  user_id: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_archived_by_1: boolean;
  is_archived_by_2: boolean;
  is_muted_by_1: boolean;
  is_muted_by_2: boolean;
  other_user_name: string | null;
  other_user_avatar: string | null;
  other_user_username: string | null;
  other_user_id: string;
  last_message_content: string | null;
  last_message_media_type: string | null;
  last_message_sender_id: string | null;
  has_unread_messages: boolean;
}

export interface UserPresence {
  user_id: string;
  last_seen: string;
  is_online: boolean;
  is_typing_in_conversation: string | null;
  updated_at: string;
}

export const useDirectMessaging = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get conversations for current user
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('conversation_list')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });

  // Get messages for a specific conversation
  const useConversationMessages = (conversationId: string) => {
    return useQuery({
      queryKey: ['conversation-messages', conversationId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            *,
            sender:profiles!direct_messages_sender_id_fkey(id, name, avatar_url, username),
            reply_to:direct_messages!direct_messages_reply_to_id_fkey(
              id, content, media_type,
              sender:profiles!direct_messages_sender_id_fkey(name)
            ),
            reactions:message_reactions(
              id, reaction, created_at,
              user:profiles!message_reactions_user_id_fkey(name, avatar_url)
            ),
            status:message_status(id, user_id, status, created_at)
          `)
          .eq('conversation_id', conversationId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data as DirectMessage[];
      },
      enabled: !!conversationId && !!user,
    });
  };

  // Send a message
  const sendMessage = useMutation({
    mutationFn: async ({
      conversationId,
      content,
      mediaUrl,
      mediaType,
      replyToId,
      lat,
      lng,
      voiceDuration,
    }: {
      conversationId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
      replyToId?: string;
      lat?: number;
      lng?: number;
      voiceDuration?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          reply_to_id: replyToId,
          lat,
          lng,
          voice_duration: voiceDuration,
        })
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(id, name, avatar_url, username)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });

  // Create or get conversation between two users
  const createOrGetConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!user) throw new Error('User not authenticated');

      const statusUpdates = messageIds.map(messageId => ({
        message_id: messageId,
        user_id: user.id,
        status: 'read' as const,
      }));

      const { error } = await supabase
        .from('message_status')
        .upsert(statusUpdates, {
          onConflict: 'message_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });

  // Add reaction to message
  const addReaction = useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          reaction,
        }, {
          onConflict: 'message_id,user_id,reaction',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Find the conversation ID from the message and invalidate
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
    },
  });

  // Remove reaction from message
  const removeReaction = useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
    },
  });

  // Edit message
  const editMessage = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { data, error } = await supabase
        .from('direct_messages')
        .update({
          content,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversation_id] });
    },
  });

  // Delete message
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('direct_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          content: null, // Clear content for privacy
          media_url: null, // Clear media for privacy
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversation_id] });
    },
  });

  // Update user presence
  const updatePresence = useCallback(async (isOnline: boolean, typingInConversation?: string | null) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        is_typing_in_conversation: typingInConversation,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Get user presence
  const { data: userPresence } = useQuery({
    queryKey: ['user-presence', user?.id],
    queryFn: async () => {
      if (!user) return {};

      const { data, error } = await supabase
        .from('user_presence')
        .select('*');

      if (error) throw error;
      
      // Convert array to object keyed by user_id for easier access
      return data.reduce((acc, presence) => {
        acc[presence.user_id] = presence;
        return acc;
      }, {} as Record<string, UserPresence>);
    },
    enabled: !!user,
  });

  return {
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    createOrGetConversation,
    markAsRead,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    updatePresence,
    userPresence: userPresence || {},
  };
};