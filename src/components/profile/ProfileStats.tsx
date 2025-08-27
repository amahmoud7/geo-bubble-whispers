import React from 'react';
import { MapPin, Calendar, TrendingUp, Users, Heart, MessageSquare } from 'lucide-react';

export interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  locations_visited?: number;
  countries_visited?: number;
  total_likes?: number;
  total_comments?: number;
  join_date: string;
  most_active_location?: string;
  profile_views?: number;
}

interface ProfileStatsProps {
  stats: ProfileStats;
  isOwnProfile: boolean;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const ProfileStats = ({ 
  stats, 
  isOwnProfile,
  onFollowersClick,
  onFollowingClick 
}: ProfileStatsProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Main stats row */}
      <div className="flex justify-around text-center">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900">
            {formatNumber(stats.posts_count)}
          </span>
          <span className="text-sm text-gray-500">Posts</span>
        </div>
        
        <button
          onClick={onFollowersClick}
          className="flex flex-col hover:opacity-70 transition-opacity"
        >
          <span className="text-xl font-bold text-gray-900">
            {formatNumber(stats.followers_count)}
          </span>
          <span className="text-sm text-gray-500">Followers</span>
        </button>
        
        <button
          onClick={onFollowingClick}
          className="flex flex-col hover:opacity-70 transition-opacity"
        >
          <span className="text-xl font-bold text-gray-900">
            {formatNumber(stats.following_count)}
          </span>
          <span className="text-sm text-gray-500">Following</span>
        </button>
      </div>

      {/* Additional stats for own profile */}
      {isOwnProfile && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {stats.profile_views !== undefined && (
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {formatNumber(stats.profile_views)} profile views
              </span>
            </div>
          )}

          {stats.total_likes !== undefined && (
            <div className="flex items-center space-x-2 text-sm">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-gray-600">
                {formatNumber(stats.total_likes)} total likes
              </span>
            </div>
          )}

          {stats.locations_visited !== undefined && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-gray-600">
                {stats.locations_visited} locations visited
              </span>
            </div>
          )}

          {stats.total_comments !== undefined && (
            <div className="flex items-center space-x-2 text-sm">
              <MessageSquare className="h-4 w-4 text-green-400" />
              <span className="text-gray-600">
                {formatNumber(stats.total_comments)} total comments
              </span>
            </div>
          )}
        </div>
      )}

      {/* Join date and location info */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Joined {formatJoinDate(stats.join_date)}</span>
        </div>

        {stats.most_active_location && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>Most active in {stats.most_active_location}</span>
          </div>
        )}

        {stats.countries_visited !== undefined && stats.countries_visited > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>Visited {stats.countries_visited} countries</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileStats;