
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, MoreHorizontal, UserPlus, UserCheck, MessageCircle, Share } from 'lucide-react';
import EditProfileDialog from './EditProfileDialog';
import ProfileBadges, { ProfileAchievement } from './ProfileBadges';
import ProfileStats, { ProfileStats as ProfileStatsType } from './ProfileStats';
import StoryHighlights, { StoryHighlight } from './StoryHighlights';
import { ProfileData } from '@/hooks/useProfileData';

interface ProfileHeaderProps {
  profile: {
    name: string;
    username: string;
    bio: string;
    location: string;
    avatar: string;
    followers?: number;
    following?: number;
    join_date?: string;
    is_verified?: boolean;
    is_private?: boolean;
    posts_count?: number;
    profile_views?: number;
  };
  stats?: ProfileStatsType;
  achievements?: ProfileAchievement[];
  storyHighlights?: StoryHighlight[];
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onSaveProfile: (data: ProfileData) => Promise<boolean>;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMessage?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onStoryHighlightClick?: (highlight: StoryHighlight) => void;
  onCreateStoryHighlight?: () => void;
}

const ProfileHeader = ({ 
  profile, 
  stats,
  achievements = [],
  storyHighlights = [],
  isOwnProfile = true,
  isFollowing = false,
  onSaveProfile,
  onFollow,
  onUnfollow,
  onMessage,
  onFollowersClick,
  onFollowingClick,
  onStoryHighlightClick,
  onCreateStoryHighlight
}: ProfileHeaderProps) => {
  const profileStats: ProfileStatsType = stats || {
    posts_count: profile.posts_count || 0,
    followers_count: profile.followers || 0,
    following_count: profile.following || 0,
    join_date: profile.join_date || new Date().toISOString(),
    profile_views: profile.profile_views,
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start space-x-6">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-2 ring-gray-100">
            <AvatarImage src={profile.avatar} className="object-cover" />
            <AvatarFallback className="text-lg md:text-xl bg-gradient-to-br from-blue-100 to-purple-100">
              {profile.name?.charAt(0) || profile.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          {/* Username and Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-normal text-gray-900">
                {profile.username || 'user'}
              </h1>
              {profile.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {isOwnProfile ? (
                <EditProfileDialog 
                  profile={{
                    name: profile.name,
                    username: profile.username,
                    bio: profile.bio,
                    location: profile.location,
                    avatar: profile.avatar
                  }}
                  onSave={onSaveProfile}
                />
              ) : (
                <>
                  <Button
                    onClick={isFollowing ? onUnfollow : onFollow}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className="px-6"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onMessage}
                    variant="outline"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats for mobile/tablet */}
          <div className="block md:hidden mb-4">
            <ProfileStats 
              stats={profileStats}
              isOwnProfile={isOwnProfile}
              onFollowersClick={onFollowersClick}
              onFollowingClick={onFollowingClick}
            />
          </div>
        </div>
      </div>

      {/* Stats for desktop */}
      <div className="hidden md:block">
        <ProfileStats 
          stats={profileStats}
          isOwnProfile={isOwnProfile}
          onFollowersClick={onFollowersClick}
          onFollowingClick={onFollowingClick}
        />
      </div>

      {/* Name and Bio */}
      <div className="space-y-2">
        {profile.name && (
          <h2 className="font-semibold text-gray-900">{profile.name}</h2>
        )}
        
        {profile.bio && (
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {profile.bio}
          </p>
        )}

        {profile.location && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{profile.location}</span>
          </div>
        )}

        {profile.join_date && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Joined {new Date(profile.join_date).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Badges */}
      {achievements.length > 0 && (
        <ProfileBadges 
          achievements={achievements}
          isVerified={profile.is_verified}
        />
      )}

      {/* Story Highlights */}
      {(storyHighlights.length > 0 || isOwnProfile) && (
        <div className="pt-4 border-t">
          <StoryHighlights
            highlights={storyHighlights}
            isOwnProfile={isOwnProfile}
            onViewHighlight={onStoryHighlightClick}
            onCreateHighlight={onCreateStoryHighlight}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
