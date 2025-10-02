
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { eventBus } from '@/utils/eventBus';
import {
  MapMessage,
  RawEvent,
  RawMessage,
  transformEventToMessage,
  transformMessage,
} from '@/types/messages';

interface Filters {
  showPublic: boolean;
  showFollowers: boolean;
}

type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

const BOUNDS_CHANGE_THRESHOLD = 0.0015; // ~150m in lat/lng degrees
const FETCH_DEBOUNCE_MS = 350;

const boundsChanged = (current: MapBounds | null, next: MapBounds | null) => {
  if (!current || !next) return true;
  return (
    Math.abs(current.north - next.north) > BOUNDS_CHANGE_THRESHOLD ||
    Math.abs(current.south - next.south) > BOUNDS_CHANGE_THRESHOLD ||
    Math.abs(current.east - next.east) > BOUNDS_CHANGE_THRESHOLD ||
    Math.abs(current.west - next.west) > BOUNDS_CHANGE_THRESHOLD
  );
};

const sanitizeMessages = (rawMessages: RawMessage[], userId?: string | null) =>
  rawMessages
    .map((message) => {
      try {
        return transformMessage(message, userId);
      } catch (error: unknown) {
        console.error('Skipping invalid message payload', error, message);
        return null;
      }
    })
    .filter((message): message is MapMessage => Boolean(message));

const sanitizeEvents = (rawEvents: RawEvent[]) =>
  rawEvents
    .map((event) => {
      try {
        return transformEventToMessage(event);
      } catch (error: unknown) {
        console.error('Skipping invalid event payload', error, event);
        return null;
      }
    })
    .filter((event): event is MapMessage => Boolean(event));

export const useMessages = () => {
  const [filters, setFilters] = useState<Filters>({
    showPublic: true,
    showFollowers: true,
  });
  const [messages, setMessages] = useState<MapMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const searchQueryRef = useRef<string>('');
  const boundsRef = useRef<MapBounds | null>(null);
  const fetchTimerRef = useRef<number | null>(null);

  const fetchMessages = useCallback(
    async (override?: { searchQuery?: string }) => {
      try {
        setLoading(true);

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const searchQuery = override?.searchQuery ?? searchQueryRef.current;
        const bounds = boundsRef.current;

        let messageQuery = supabase
          .from('messages')
          .select('*')
          .or(`expires_at.gte.${now.toISOString()},expires_at.is.null,created_at.gte.${oneDayAgo}`)
          .order('created_at', { ascending: false })
          .limit(200);

        if (bounds) {
          messageQuery = messageQuery
            .gte('lat', bounds.south)
            .lte('lat', bounds.north)
            .gte('lng', bounds.west)
            .lte('lng', bounds.east);
        }

        if (searchQuery.trim()) {
          messageQuery = messageQuery.or(
            `content.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
          );
        }

        const eventsQuery = supabase
          .from('events')
          .select('*')
          .gte('start_date', now.toISOString())
          .order('start_date', { ascending: true })
          .limit(50);

        const [messagesResult, eventsResult] = await Promise.allSettled([
          messageQuery,
          eventsQuery,
        ]);

        if (messagesResult.status === 'rejected') {
          throw messagesResult.reason;
        }

        const parsedMessages = sanitizeMessages((messagesResult.value.data ?? []) as RawMessage[], user?.id);

        let parsedEvents: MapMessage[] = [];
        if (eventsResult.status === 'fulfilled') {
          parsedEvents = sanitizeEvents((eventsResult.value.data ?? []) as RawEvent[]);
        } else if (import.meta.env.DEV) {
          console.warn('Events query failed', eventsResult.reason);
        }

        const combined = [...parsedMessages, ...parsedEvents].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setMessages(combined);
      } catch (error: unknown) {
        console.error('Error fetching messages', error);
        const message = error instanceof Error ? error.message : '';
        if (message && !/auth/i.test(message)) {
          toast({
            title: 'Unable to load messages',
            description: 'Please check your network connection and try again.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const enqueueFetch = useCallback(() => {
    if (fetchTimerRef.current) {
      window.clearTimeout(fetchTimerRef.current);
    }
    fetchTimerRef.current = window.setTimeout(() => {
      fetchMessages();
    }, FETCH_DEBOUNCE_MS);
  }, [fetchMessages]);

  const addMessage = useCallback((newMessage: MapMessage) => {
    setMessages((prev) => [newMessage, ...prev]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<MapMessage>) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)));
  }, []);

  const searchMessages = useCallback(
    (query: string) => {
      searchQueryRef.current = query;
      enqueueFetch();
    },
    [enqueueFetch]
  );

  const updateBounds = useCallback(
    (bounds: MapBounds | null) => {
      if (!boundsChanged(boundsRef.current, bounds)) return;
      boundsRef.current = bounds;
      enqueueFetch();
    },
    [enqueueFetch]
  );

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => enqueueFetch()
      )
      .subscribe();

    const offRefresh = eventBus.on('refreshMessages', () => enqueueFetch());

    return () => {
      supabase.removeChannel(channel);
      offRefresh();
      if (fetchTimerRef.current) {
        window.clearTimeout(fetchTimerRef.current);
      }
    };
  }, [enqueueFetch, fetchMessages]);

  const handleFilterChange = useCallback((type: keyof Filters, checked: boolean) => {
    setFilters((prev) => ({ ...prev, [type]: checked }));
  }, []);

  const filteredMessages = useMemo(
    () =>
      messages.filter((message) =>
        (message.isPublic && filters.showPublic) || (!message.isPublic && filters.showFollowers)
      ),
    [messages, filters]
  );

  return {
    filters,
    filteredMessages,
    messages,
    addMessage,
    updateMessage,
    handleFilterChange,
    searchMessages,
    loading,
    refreshMessages: fetchMessages,
    updateBounds,
  };
};
