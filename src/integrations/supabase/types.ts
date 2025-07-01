export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_id: string | null
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          created_at: string
          event_id: string | null
          expiresAt: string | null
          id: number
          lat: number | null
          lng: number | null
          name: string | null
          source: string | null
          start_date: string | null
          url: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          expiresAt?: string | null
          id?: number
          lat?: number | null
          lng?: number | null
          name?: string | null
          source?: string | null
          start_date?: string | null
          url?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          expiresAt?: string | null
          id?: number
          lat?: number | null
          lng?: number | null
          name?: string | null
          source?: string | null
          start_date?: string | null
          url?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string | null
          followed_id: string | null
          follower_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_id?: string | null
          follower_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string | null
          follower_id?: string | null
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          message_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_locations: {
        Row: {
          id: string
          lat: number
          lng: number
          stream_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          stream_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          stream_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_locations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_viewers: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          left_at: string | null
          stream_id: string
          viewer_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          stream_id: string
          viewer_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          current_lat: number
          current_lng: number
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean
          start_lat: number
          start_lng: number
          stream_url: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          viewer_count: number
        }
        Insert: {
          created_at?: string
          current_lat: number
          current_lng: number
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          start_lat: number
          start_lng: number
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          viewer_count?: number
        }
        Update: {
          created_at?: string
          current_lat?: number
          current_lng?: number
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          start_lat?: number
          start_lng?: number
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          viewer_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_public: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          media_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          media_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          media_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          location: string | null
          name: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          location?: string | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          content: string | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          location: string | null
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean | null
          email: string
          id: string
          name: string | null
          subscribed_at: string | null
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          email: string
          id?: string
          name?: string | null
          subscribed_at?: string | null
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          email?: string
          id?: string
          name?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_expired_stories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      end_live_stream: {
        Args: { stream_id_param: string }
        Returns: undefined
      }
      update_live_stream_location: {
        Args: { stream_id_param: string; new_lat: number; new_lng: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
