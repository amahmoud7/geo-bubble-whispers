
export interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  is_public: boolean;
  location: string;
  lat: number;
  lng: number;
  created_at: string;
  expires_at: string;
  updated_at: string;
  // For joined data
  profiles?: Profile;
  likes?: Like[];
}

export interface Comment {
  id: string;
  message_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // For joined data
  profiles?: Profile;
  likes?: Like[];
}

export interface Like {
  id: string;
  message_id: string | null;
  comment_id: string | null;
  user_id: string;
  created_at: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  updated_at: string;
  // For joined data
  profiles?: Profile;
  story_views?: StoryView[];
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  // For joined data
  profiles?: Profile;
}
