import { supabase } from '@/integrations/supabase/client';

export interface LiveStreamData {
  id: string;
  title: string;
  streamUrl: string;
  thumbnailUrl?: string;
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  userId: string;
  userName: string;
  userAvatar?: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: string;
  endedAt?: string;
  isPrivate: boolean;
}

export interface StreamSettings {
  quality: 'low' | 'medium' | 'high';
  frameRate: number;
  bitrate: number;
}

export class LiveStreamService {
  private static streams = new Map<string, LiveStreamData>();
  private static streamConnections = new Map<string, MediaStream>();

  /**
   * Start a new livestream
   */
  static async startLiveStream(
    stream: MediaStream,
    title: string,
    location: { lat: number; lng: number; name?: string },
    isPrivate: boolean = false
  ): Promise<LiveStreamData> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      // Generate unique stream ID
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, you would:
      // 1. Set up WebRTC peer connection
      // 2. Configure streaming server (like AWS Kinesis, Agora, etc.)
      // 3. Generate RTMP endpoint
      
      // For now, we'll simulate with a stream URL (avoiding MediaStreamTrackGenerator for compatibility)
      // In production, this would be a proper RTMP/HLS URL from your streaming service
      const streamUrl = `wss://stream.example.com/live/${streamId}`;
      
      const liveStreamData: LiveStreamData = {
        id: streamId,
        title,
        streamUrl,
        location,
        userId: user.id,
        userName: profile?.name || user.email || 'Anonymous',
        userAvatar: profile?.avatar_url,
        isLive: true,
        viewerCount: 0,
        startedAt: new Date().toISOString(),
        isPrivate
      };

      // Store stream data
      this.streams.set(streamId, liveStreamData);
      this.streamConnections.set(streamId, stream);

      // Save to database
      const { error } = await supabase
        .from('messages')
        .insert({
          content: title,
          user_id: user.id,
          lat: location.lat,
          lng: location.lng,
          is_public: !isPrivate,
          message_type: 'livestream',
          livestream_url: streamUrl,
          livestream_title: title,
          is_live: true
        });

      if (error) throw error;

      // Notify other users via real-time channel
      const channel = supabase.channel('livestreams');
      channel.send({
        type: 'broadcast',
        event: 'stream_started',
        payload: liveStreamData
      });

      console.log('🔴 LiveStream started:', liveStreamData);
      return liveStreamData;

    } catch (error: any) {
      console.error('Error starting livestream:', error);
      throw new Error(`Failed to start livestream: ${error.message}`);
    }
  }

  /**
   * End a livestream
   */
  static async endLiveStream(streamId: string): Promise<void> {
    try {
      const streamData = this.streams.get(streamId);
      if (!streamData) throw new Error('Stream not found');

      // Stop media stream
      const mediaStream = this.streamConnections.get(streamId);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        this.streamConnections.delete(streamId);
      }

      // Update stream data
      streamData.isLive = false;
      streamData.endedAt = new Date().toISOString();

      // Update database
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_live: false,
          ended_at: streamData.endedAt
        })
        .eq('livestream_url', streamData.streamUrl);

      if (error) throw error;

      // Notify viewers
      const channel = supabase.channel('livestreams');
      channel.send({
        type: 'broadcast',
        event: 'stream_ended',
        payload: { streamId }
      });

      // Clean up
      this.streams.delete(streamId);
      if (streamData.streamUrl.startsWith('blob:')) {
        URL.revokeObjectURL(streamData.streamUrl);
      }

      console.log('🔴 LiveStream ended:', streamId);

    } catch (error: any) {
      console.error('Error ending livestream:', error);
      throw new Error(`Failed to end livestream: ${error.message}`);
    }
  }

  /**
   * Get all active livestreams
   */
  static async getActiveLiveStreams(userLocation?: { lat: number; lng: number }): Promise<LiveStreamData[]> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          content,
          lat,
          lng,
          created_at,
          livestream_url,
          livestream_title,
          is_live,
          user_id,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('message_type', 'livestream')
        .eq('is_live', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const streams: LiveStreamData[] = (data || []).map((stream: any) => ({
        id: stream.id,
        title: stream.livestream_title || stream.content,
        streamUrl: stream.livestream_url,
        location: {
          lat: stream.lat,
          lng: stream.lng,
          name: 'Live Location'
        },
        userId: stream.user_id,
        userName: stream.profiles?.name || 'Anonymous',
        userAvatar: stream.profiles?.avatar_url,
        isLive: stream.is_live,
        viewerCount: Math.floor(Math.random() * 50), // Simulate viewer count
        startedAt: stream.created_at,
        isPrivate: false
      }));

      // Sort by distance if user location is provided
      if (userLocation) {
        streams.sort((a, b) => {
          const distanceA = this.calculateDistance(userLocation, a.location);
          const distanceB = this.calculateDistance(userLocation, b.location);
          return distanceA - distanceB;
        });
      }

      return streams;

    } catch (error: any) {
      console.error('Error fetching livestreams:', error);
      return [];
    }
  }

  /**
   * Join a livestream as viewer
   */
  static async joinLiveStream(streamId: string): Promise<LiveStreamData | null> {
    try {
      const streamData = this.streams.get(streamId);
      if (streamData) {
        streamData.viewerCount++;
        return streamData;
      }

      // If not in memory, try to fetch from database
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          lat,
          lng,
          created_at,
          livestream_url,
          livestream_title,
          is_live,
          user_id,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('id', streamId)
        .eq('message_type', 'livestream')
        .eq('is_live', true)
        .single();

      if (error || !data) return null;

      const stream: LiveStreamData = {
        id: data.id,
        title: data.livestream_title || data.content,
        streamUrl: data.livestream_url,
        location: {
          lat: data.lat,
          lng: data.lng,
          name: 'Live Location'
        },
        userId: data.user_id,
        userName: data.profiles?.name || 'Anonymous',
        userAvatar: data.profiles?.avatar_url,
        isLive: data.is_live,
        viewerCount: Math.floor(Math.random() * 50) + 1,
        startedAt: data.created_at,
        isPrivate: false
      };

      this.streams.set(streamId, stream);
      return stream;

    } catch (error: any) {
      console.error('Error joining livestream:', error);
      return null;
    }
  }

  /**
   * Leave a livestream
   */
  static leaveLiveStream(streamId: string): void {
    const streamData = this.streams.get(streamId);
    if (streamData) {
      streamData.viewerCount = Math.max(0, streamData.viewerCount - 1);
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get optimal stream settings based on connection quality
   */
  static getOptimalStreamSettings(connectionQuality: 'poor' | 'good' | 'excellent'): StreamSettings {
    switch (connectionQuality) {
      case 'poor':
        return { quality: 'low', frameRate: 15, bitrate: 500000 };
      case 'good':
        return { quality: 'medium', frameRate: 24, bitrate: 1000000 };
      case 'excellent':
        return { quality: 'high', frameRate: 30, bitrate: 2500000 };
      default:
        return { quality: 'medium', frameRate: 24, bitrate: 1000000 };
    }
  }
}

export default LiveStreamService;