
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Profile, Message } from '@/types/database';

// Interface for profile data
interface ProfileData {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  followers?: number;
  following?: number;
  messages?: Message[];
}

// Initial profile data for new users
const defaultProfile: ProfileData = {
  name: '',
  username: '',
  avatar: '',
  bio: '',
  location: '',
  followers: 0,
  following: 0,
  messages: [],
};

export const useProfileData = (userId: string | undefined) => {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch profile data from Supabase
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Format the profile data
      setProfile({
        name: profileData.name || '',
        username: profileData.username || '',
        avatar: profileData.avatar_url || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        followers: 0,
        following: 0,
        messages: [], // We'll fetch messages separately
      });

      // Fetch messages (in a real app, this would be a separate query)
      fetchUserMessages(userId);

    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserMessages = async (userId: string) => {
    // In a real app, we would fetch messages from the database
    // For now, we'll use mock data
    setProfile(prev => ({
      ...prev,
      messages: [
        {
          id: '101',
          content: 'Found this amazing food market today! Worth checking out.',
          location: 'Ferry Building, San Francisco',
          timestamp: '2023-05-10T14:30:00Z',
          isPublic: true,
          mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
        },
        {
          id: '102',
          content: 'Beautiful sunset over the Golden Gate Bridge today!',
          location: 'Crissy Field, San Francisco',
          timestamp: '2023-05-08T19:45:00Z',
          isPublic: true,
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        },
      ]
    }));
  };

  const saveProfile = async (updatedProfileData: any) => {
    try {
      if (!userId) return;
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedProfileData.name,
          username: updatedProfileData.username,
          bio: updatedProfileData.bio,
          location: updatedProfileData.location,
          avatar_url: updatedProfileData.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update the local state
      setProfile({
        ...profile,
        name: updatedProfileData.name,
        username: updatedProfileData.username,
        bio: updatedProfileData.bio,
        location: updatedProfileData.location,
        avatar: updatedProfileData.avatar,
      });
      
      toast({
        title: "Success",
        description: "Profile has been updated successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive"
      });
      return false;
    }
  };

  return { profile, isLoading, saveProfile };
};

export type { ProfileData };
export { defaultProfile };
