export interface LiveStream {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  stream_url: string | null;
  thumbnail_url: string | null;
  start_lat: number;
  start_lng: number;
  current_lat: number;
  current_lng: number;
  is_live: boolean;
  viewer_count: number;
  created_at: string;
  ended_at: string | null;
  updated_at: string;
  // For joined data
  profiles?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface LiveStreamLocation {
  id: string;
  stream_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface LiveStreamViewer {
  id: string;
  stream_id: string;
  viewer_id: string;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
}