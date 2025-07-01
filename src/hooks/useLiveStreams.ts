import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LiveStream, LiveStreamLocation } from '@/types/livestream';
import { useAuth } from '@/hooks/useAuth';

export const useLiveStreams = () => {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchLiveStreams();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const fetchLiveStreams = async () => {
    try {
      setIsLoading(true);
      
      const { data: streamsData, error: streamsError } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_live', true)
        .order('created_at', { ascending: false });

      if (streamsError) throw streamsError;

      // Fetch profiles for the streams
      const userIds = [...new Set(streamsData?.map(stream => stream.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine streams with profiles
      const streamsWithProfiles = streamsData?.map(stream => ({
        ...stream,
        profiles: profilesData?.find(profile => profile.id === stream.user_id)
      })) || [];

      setLiveStreams(streamsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching live streams:', error);
      toast({
        title: "Error",
        description: "Failed to load live streams",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    channelRef.current = supabase
      .channel('live-streams-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_streams'
        },
        (payload) => {
          console.log('New live stream:', payload);
          fetchLiveStreams(); // Refetch to get profile data
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_streams'
        },
        (payload) => {
          console.log('Live stream updated:', payload);
          setLiveStreams(prev => prev.map(stream => 
            stream.id === payload.new.id 
              ? { ...stream, ...payload.new }
              : stream
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_streams'
        },
        (payload) => {
          console.log('Live stream deleted:', payload);
          setLiveStreams(prev => prev.filter(stream => stream.id !== payload.old.id));
        }
      )
      .subscribe();
  };

  const startLiveStream = async (data: {
    title?: string;
    description?: string;
    lat: number;
    lng: number;
  }): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: streamData, error } = await supabase
        .from('live_streams')
        .insert({
          user_id: user.id,
          title: data.title || null,
          description: data.description || null,
          start_lat: data.lat,
          start_lng: data.lng,
          current_lat: data.lat,
          current_lng: data.lng,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live stream started!",
      });

      return streamData.id;
    } catch (error: any) {
      console.error('Error starting live stream:', error);
      toast({
        title: "Error",
        description: "Failed to start live stream",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateStreamLocation = async (streamId: string, lat: number, lng: number) => {
    try {
      const { error } = await supabase.rpc('update_live_stream_location', {
        stream_id_param: streamId,
        new_lat: lat,
        new_lng: lng
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating stream location:', error);
    }
  };

  const endLiveStream = async (streamId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('end_live_stream', {
        stream_id_param: streamId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live stream ended!",
      });

      return true;
    } catch (error: any) {
      console.error('Error ending live stream:', error);
      toast({
        title: "Error",
        description: "Failed to end live stream",
        variant: "destructive"
      });
      return false;
    }
  };

  const joinStreamAsViewer = async (streamId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('live_stream_viewers')
        .upsert({
          stream_id: streamId,
          viewer_id: user.id,
          is_active: true
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error joining stream:', error);
      return false;
    }
  };

  const leaveStreamAsViewer = async (streamId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('live_stream_viewers')
        .update({
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('stream_id', streamId)
        .eq('viewer_id', user.id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error leaving stream:', error);
      return false;
    }
  };

  return {
    liveStreams,
    isLoading,
    startLiveStream,
    updateStreamLocation,
    endLiveStream,
    joinStreamAsViewer,
    leaveStreamAsViewer,
    fetchLiveStreams
  };
};