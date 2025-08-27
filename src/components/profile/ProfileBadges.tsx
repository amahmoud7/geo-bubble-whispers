import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Star, 
  Crown, 
  Compass, 
  Users, 
  Camera, 
  Globe, 
  TrendingUp,
  Award
} from 'lucide-react';

export interface ProfileAchievement {
  id: string;
  user_id: string;
  achievement_type: 'early_adopter' | 'verified' | 'top_poster' | 'explorer' | 
                   'social_butterfly' | 'content_creator' | 'globe_trotter' | 'trendsetter';
  achievement_data: Record<string, any>;
  earned_at: string;
  is_active: boolean;
}

interface ProfileBadgesProps {
  achievements: ProfileAchievement[];
  isVerified?: boolean;
  className?: string;
}

const achievementConfig = {
  early_adopter: {
    icon: Crown,
    label: 'Early Adopter',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'One of the first users to join Geo Bubble Whispers'
  },
  verified: {
    icon: Shield,
    label: 'Verified',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Verified account'
  },
  top_poster: {
    icon: Star,
    label: 'Top Poster',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Shared over 100 location-based posts'
  },
  explorer: {
    icon: Compass,
    label: 'Explorer',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Visited and posted from 50+ different locations'
  },
  social_butterfly: {
    icon: Users,
    label: 'Social Butterfly',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    description: 'Connected with 1000+ followers'
  },
  content_creator: {
    icon: Camera,
    label: 'Content Creator',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Consistently creates engaging content'
  },
  globe_trotter: {
    icon: Globe,
    label: 'Globe Trotter',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Posted from 10+ different countries'
  },
  trendsetter: {
    icon: TrendingUp,
    label: 'Trendsetter',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Posts frequently go viral in the community'
  }
};

const ProfileBadges = ({ achievements, isVerified, className = '' }: ProfileBadgesProps) => {
  // Add verified badge if user is verified
  const allBadges = [
    ...(isVerified ? [{
      id: 'verified',
      user_id: '',
      achievement_type: 'verified' as const,
      achievement_data: {},
      earned_at: '',
      is_active: true
    }] : []),
    ...achievements.filter(achievement => achievement.is_active)
  ];

  if (allBadges.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {allBadges.map((achievement) => {
        const config = achievementConfig[achievement.achievement_type];
        const Icon = config.icon;
        
        return (
          <Badge
            key={achievement.id}
            variant="outline"
            className={`${config.color} flex items-center space-x-1 px-2 py-1 text-xs font-medium border`}
            title={config.description}
          >
            <Icon className="w-3 h-3" />
            <span>{config.label}</span>
          </Badge>
        );
      })}
    </div>
  );
};

// Detailed badges view for profile modal/expanded view
export const ProfileBadgesDetailed = ({ achievements, isVerified }: ProfileBadgesProps) => {
  const allBadges = [
    ...(isVerified ? [{
      id: 'verified',
      user_id: '',
      achievement_type: 'verified' as const,
      achievement_data: {},
      earned_at: new Date().toISOString(),
      is_active: true
    }] : []),
    ...achievements.filter(achievement => achievement.is_active)
  ];

  if (allBadges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No achievements yet</p>
        <p className="text-sm">Keep posting to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {allBadges.map((achievement) => {
        const config = achievementConfig[achievement.achievement_type];
        const Icon = config.icon;
        const earnedDate = achievement.earned_at ? 
          new Date(achievement.earned_at).toLocaleDateString() : '';
        
        return (
          <div
            key={achievement.id}
            className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50"
          >
            <div className={`p-2 rounded-full ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900">{config.label}</h4>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
              {earnedDate && (
                <p className="text-xs text-gray-400 mt-1">Earned {earnedDate}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileBadges;