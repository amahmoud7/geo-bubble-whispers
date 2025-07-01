import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Story, StoryView } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

export const useStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
    if (user) {
      fetchUserStories();
    }
  }, [user]);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all active stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Fetch profiles for the stories
      const userIds = [...new Set(storiesData?.map(story => story.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine stories with profiles
      const storiesWithProfiles = storiesData?.map(story => ({
        ...story,
        profiles: profilesData?.find(profile => profile.id === story.user_id)
      })) || [];

      // Group stories by user and get the latest one for each user
      const userStoriesMap = new Map<string, any>();
      storiesWithProfiles.forEach((story) => {
        const existingStory = userStoriesMap.get(story.user_id);
        if (!existingStory || new Date(story.created_at) > new Date(existingStory.created_at)) {
          userStoriesMap.set(story.user_id, story);
        }
      });

      setStories(Array.from(userStoriesMap.values()));
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserStories(data || []);
    } catch (error: any) {
      console.error('Error fetching user stories:', error);
    }
  };

  const fetchStoriesByUser = async (userId: string): Promise<Story[]> => {
    try {
      // Fetch stories for the user
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Fetch profile for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Combine stories with profile
      const storiesWithProfile = storiesData?.map(story => ({
        ...story,
        profiles: profileData
      })) || [];

      return storiesWithProfile;
    } catch (error: any) {
      console.error('Error fetching user stories:', error);
      return [];
    }
  };

  const createStory = async (storyData: {
    content?: string;
    media_url?: string;
    media_type?: string;
    location?: string;
    lat?: number;
    lng?: number;
  }): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          content: storyData.content || null,
          media_url: storyData.media_url || null,
          media_type: storyData.media_type || 'image',
          location: storyData.location || null,
          lat: storyData.lat || null,
          lng: storyData.lng || null,
        });

      if (error) throw error;

      await fetchStories();
      await fetchUserStories();
      
      toast({
        title: "Success",
        description: "Story posted successfully!",
      });

      return true;
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast({
        title: "Error",
        description: "Failed to post story",
        variant: "destructive"
      });
      return false;
    }
  };

  const markStoryAsViewed = async (storyId: string) => {
    if (!user) return;

    try {
      // Check if already viewed
      const { data: existingView } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('viewer_id', user.id)
        .single();

      if (existingView) return; // Already viewed

      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id,
        });

      if (error) throw error;
    } catch (error: any) {
      // Silently handle error for view tracking
      console.error('Error marking story as viewed:', error);
    }
  };

  const deleteStory = async (storyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      await fetchStories();
      await fetchUserStories();
      
      toast({
        title: "Success",
        description: "Story deleted successfully!",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    stories,
    userStories,
    isLoading,
    fetchStories,
    fetchUserStories,
    fetchStoriesByUser,
    createStory,
    markStoryAsViewed,
    deleteStory,
  };
};