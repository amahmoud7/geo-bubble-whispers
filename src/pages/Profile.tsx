
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileLoadingState from '../components/profile/ProfileLoadingState';
import ProfileUnauthenticated from '../components/profile/ProfileUnauthenticated';
import FollowersModal, { FollowUser } from '../components/profile/FollowersModal';
import { StoryHighlight } from '../components/profile/StoryHighlights';
import { ProfileAchievement } from '../components/profile/ProfileBadges';
import EventsManager from '../components/EventsManager';
import { useProfileData, ProfileData } from '@/hooks/useProfileData';
import { Message } from '@/types/database';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, saveProfile } = useProfileData(user?.id);
  
  // Modal states
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Followers' | 'Following'>('Followers');

  // Mock data for demonstration - in real app, this would come from API
  const mockFollowers: FollowUser[] = [
    {
      id: '1',
      username: 'john_explorer',
      name: 'John Smith',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      is_verified: true,
      is_following: false,
      bio: 'Adventure seeker 🏔️'
    },
    {
      id: '2', 
      username: 'sarah_travel',
      name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612c14e',
      is_following: true,
      bio: 'Travel photographer'
    }
  ];

  const mockStoryHighlights: StoryHighlight[] = [
    {
      id: '1',
      title: 'SF Adventures',
      cover_image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
      story_ids: ['story1', 'story2'],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Food Tours',
      cover_image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      story_ids: ['story3', 'story4'],
      created_at: new Date().toISOString()
    }
  ];

  const mockAchievements: ProfileAchievement[] = [
    {
      id: '1',
      user_id: user?.id || '',
      achievement_type: 'early_adopter',
      achievement_data: {},
      earned_at: new Date().toISOString(),
      is_active: true
    },
    {
      id: '2',
      user_id: user?.id || '',
      achievement_type: 'explorer',
      achievement_data: { locations_count: 52 },
      earned_at: new Date().toISOString(),
      is_active: true
    }
  ];

  // Handler functions
  const handleFollowersClick = () => {
    setModalType('Followers');
    setFollowersModalOpen(true);
  };

  const handleFollowingClick = () => {
    setModalType('Following');
    setFollowingModalOpen(true);
  };

  const handleFollowUser = (userId: string) => {
    console.log('Follow user:', userId);
    // In real app, make API call to follow user
  };

  const handleUnfollowUser = (userId: string) => {
    console.log('Unfollow user:', userId);
    // In real app, make API call to unfollow user
  };

  const handleUserClick = (user: FollowUser) => {
    console.log('Navigate to user profile:', user);
    // Navigate to user's profile
  };

  const handleMessageClick = (message: Message) => {
    console.log('Open message detail:', message);
    // Navigate to message detail view
  };

  const handleStoryHighlightClick = (highlight: StoryHighlight) => {
    console.log('View story highlight:', highlight);
    // Open story viewer
  };

  const handleCreateStoryHighlight = () => {
    console.log('Create new story highlight');
    // Open story highlight creator
  };

  // Enhanced profile data with Instagram-style features
  const enhancedProfile = {
    ...profile,
    join_date: new Date().toISOString(), // In real app, this would come from the database
    is_verified: false, // This would be determined by database
    posts_count: profile.messages?.length || 0,
    profile_views: 156, // Mock data
  };

  const profileStats = {
    posts_count: enhancedProfile.posts_count,
    followers_count: enhancedProfile.followers || 0,
    following_count: enhancedProfile.following || 0,
    locations_visited: 24, // Mock data
    countries_visited: 8, // Mock data
    total_likes: 342, // Mock data
    total_comments: 87, // Mock data
    join_date: enhancedProfile.join_date,
    most_active_location: 'San Francisco, CA',
    profile_views: enhancedProfile.profile_views,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col pb-20">
        <Navigation />
        <ProfileLoadingState />
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col pb-20">
        <Navigation />
        <ProfileUnauthenticated />
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-white">
      <Navigation />
      
      <div className="container max-w-4xl mx-auto py-6 space-y-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        {/* Main Profile Section */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <ProfileHeader 
              profile={enhancedProfile}
              stats={profileStats}
              achievements={mockAchievements}
              storyHighlights={mockStoryHighlights}
              isOwnProfile={true}
              onSaveProfile={saveProfile}
              onFollowersClick={handleFollowersClick}
              onFollowingClick={handleFollowingClick}
              onStoryHighlightClick={handleStoryHighlightClick}
              onCreateStoryHighlight={handleCreateStoryHighlight}
            />
          </div>
          
          <div className="border-t border-gray-100">
            <div className="p-6">
              <ProfileTabs 
                messages={profile.messages || []}
                savedMessages={[]} // In real app, fetch saved messages
                eventMessages={profile.messages?.filter(m => m.media_type === 'event') || []}
                onMessageClick={handleMessageClick}
              />
            </div>
          </div>
        </div>

        {/* Events Management Section */}
        <div className="bg-white rounded-lg border border-gray-100">
          <EventsManager />
        </div>
      </div>
      
      <BottomNavigation />

      {/* Followers/Following Modals */}
      <FollowersModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        title="Followers"
        users={mockFollowers}
        currentUserId={user?.id}
        onFollow={handleFollowUser}
        onUnfollow={handleUnfollowUser}
        onUserClick={handleUserClick}
      />

      <FollowersModal
        isOpen={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        title="Following"
        users={mockFollowers} // In real app, this would be different data
        currentUserId={user?.id}
        onFollow={handleFollowUser}
        onUnfollow={handleUnfollowUser}
        onUserClick={handleUserClick}
      />
    </div>
  );
};

export default Profile;
