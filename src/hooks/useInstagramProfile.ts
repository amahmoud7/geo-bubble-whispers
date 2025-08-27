import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { ProfileAchievement } from '@/components/profile/ProfileBadges';
import { StoryHighlight } from '@/components/profile/StoryHighlights';
import { FollowUser } from '@/components/profile/FollowersModal';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { useProfileData } from './useProfileData';

export interface InstagramProfileData {
  profileStats: ProfileStats;
  achievements: ProfileAchievement[];
  storyHighlights: StoryHighlight[];
  followers: FollowUser[];
  following: FollowUser[];
  savedMessages: any[];
  isFollowing?: boolean;
}

export const useInstagramProfile = (userId: string | undefined, targetUserId?: string) => {
  const { profile, isLoading: profileLoading, saveProfile } = useProfileData(targetUserId || userId);
  const [instagramData, setInstagramData] = useState<InstagramProfileData>({
    profileStats: {
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      join_date: new Date().toISOString(),
    },
    achievements: [],
    storyHighlights: [],
    followers: [],
    following: [],
    savedMessages: [],
    isFollowing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (targetUserId || userId) {
      fetchInstagramProfileData(targetUserId || userId!);
    }
  }, [userId, targetUserId]);

  const fetchInstagramProfileData = async (profileUserId: string) => {
    try {
      setIsLoading(true);

      // Fetch profile stats
      const statsPromise = fetchProfileStats(profileUserId);
      
      // Fetch achievements
      const achievementsPromise = fetchAchievements(profileUserId);
      
      // Fetch story highlights
      const highlightsPromise = fetchStoryHighlights(profileUserId);
      
      // Fetch followers/following if viewing own profile or if public
      const followersPromise = fetchFollowers(profileUserId);
      const followingPromise = fetchFollowing(profileUserId);
      
      // Check if current user is following this profile (if different users)
      const isFollowingPromise = targetUserId && targetUserId !== userId 
        ? checkIsFollowing(userId!, targetUserId)
        : Promise.resolve(false);

      // Fetch saved messages if own profile
      const savedMessagesPromise = profileUserId === userId 
        ? fetchSavedMessages(profileUserId)
        : Promise.resolve([]);

      const [
        stats,
        achievements,
        highlights,
        followers,
        following,
        isFollowing,
        savedMessages
      ] = await Promise.all([
        statsPromise,
        achievementsPromise,
        highlightsPromise,
        followersPromise,
        followingPromise,
        isFollowingPromise,
        savedMessagesPromise
      ]);

      setInstagramData({
        profileStats: stats,
        achievements,
        storyHighlights: highlights,
        followers,
        following,
        isFollowing,
        savedMessages,
      });

    } catch (error: any) {
      console.error('Error fetching Instagram profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileStats = async (profileUserId: string): Promise<ProfileStats> => {
    try {
      // Get follower count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileUserId);

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileUserId);

      // Get posts count
      const { count: postsCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileUserId)
        .eq('is_public', true);

      // Get profile data for join date
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at, profile_views')
        .eq('id', profileUserId)
        .single();

      return {
        posts_count: postsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        join_date: profileData?.created_at || new Date().toISOString(),
        profile_views: profileData?.profile_views || 0,
        // Additional stats would be calculated based on user's activity
        locations_visited: 0, // Would need separate query
        countries_visited: 0, // Would need separate query
        total_likes: 0, // Would need join with likes table
        total_comments: 0, // Would need join with comments table
        most_active_location: undefined,
      };
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      return {
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        join_date: new Date().toISOString(),
      };
    }
  };

  const fetchAchievements = async (profileUserId: string): Promise<ProfileAchievement[]> => {
    try {
      const { data, error } = await supabase
        .from('profile_achievements')
        .select('*')
        .eq('user_id', profileUserId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  };

  const fetchStoryHighlights = async (profileUserId: string): Promise<StoryHighlight[]> => {
    try {
      const { data, error } = await supabase
        .from('story_highlights')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching story highlights:', error);
      return [];
    }
  };

  const fetchFollowers = async (profileUserId: string): Promise<FollowUser[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            username,
            name,
            avatar_url,
            is_verified,
            bio
          )
        `)
        .eq('following_id', profileUserId);

      if (error) throw error;

      return (data || []).map((follow: any) => ({
        id: follow.profiles.id,
        username: follow.profiles.username || 'user',
        name: follow.profiles.name || follow.profiles.username || 'User',
        avatar_url: follow.profiles.avatar_url,
        is_verified: follow.profiles.is_verified,
        bio: follow.profiles.bio,
        is_following: false, // Would need additional query to check
      }));
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  };

  const fetchFollowing = async (profileUserId: string): Promise<FollowUser[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:following_id (
            id,
            username,
            name,
            avatar_url,
            is_verified,
            bio
          )
        `)
        .eq('follower_id', profileUserId);

      if (error) throw error;

      return (data || []).map((follow: any) => ({
        id: follow.profiles.id,
        username: follow.profiles.username || 'user',
        name: follow.profiles.name || follow.profiles.username || 'User',
        avatar_url: follow.profiles.avatar_url,
        is_verified: follow.profiles.is_verified,
        bio: follow.profiles.bio,
        is_following: true,
      }));
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  };

  const checkIsFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  const fetchSavedMessages = async (profileUserId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('saved_messages')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', profileUserId)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(saved => saved.messages);
    } catch (error) {
      console.error('Error fetching saved messages:', error);
      return [];
    }
  };

  const followUser = async (targetUserId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: targetUserId
        });

      if (error) throw error;

      // Update local state
      setInstagramData(prev => ({
        ...prev,
        isFollowing: true,
        profileStats: {
          ...prev.profileStats,
          followers_count: prev.profileStats.followers_count + 1
        }
      }));

      return true;
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive"
      });
      return false;
    }
  };

  const unfollowUser = async (targetUserId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

      if (error) throw error;

      // Update local state
      setInstagramData(prev => ({
        ...prev,
        isFollowing: false,
        profileStats: {
          ...prev.profileStats,
          followers_count: Math.max(0, prev.profileStats.followers_count - 1)
        }
      }));

      return true;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    profile,
    instagramData,
    isLoading: profileLoading || isLoading,
    saveProfile,
    followUser,
    unfollowUser,
    refreshData: () => fetchInstagramProfileData(targetUserId || userId!)
  };
};