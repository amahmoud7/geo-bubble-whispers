import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/services/pushNotifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FollowSystemProps {
  targetUserId: string;
  targetUserName?: string;
  targetUserAvatar?: string;
  showStats?: boolean;
  className?: string;
}

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

const FollowSystem: React.FC<FollowSystemProps> = ({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  showStats = true,
  className
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    isFollowedBy: false
  });
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user && targetUserId) {
      fetchFollowStats();
      subscribeToFollowChanges();
    }
  }, [user, targetUserId]);

  const fetchFollowStats = async () => {
    if (!user) return;

    try {
      // Get followers count
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      // Get following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      // Check if current user is following target user
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      // Check if target user is following current user
      const { data: followedByData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', user.id)
        .single();

      setStats({
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing: !!followingData,
        isFollowedBy: !!followedByData
      });
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    }
  };

  const subscribeToFollowChanges = () => {
    const channel = supabase
      .channel(`follows-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `following_id=eq.${targetUserId}`
        },
        () => {
          fetchFollowStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${targetUserId}`
        },
        () => {
          fetchFollowStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users',
        variant: 'destructive'
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: 'Cannot follow yourself',
        description: 'You cannot follow your own account',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      if (stats.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        toast({
          title: 'Unfollowed',
          description: `You unfollowed ${targetUserName || 'this user'}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;

        // Send notification to the followed user
        const { data: userData } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();

        if (userData) {
          pushNotificationService.sendFollowerNotification({
            userId: user.id,
            userName: userData.name || 'Someone',
            avatarUrl: userData.avatar_url
          });
        }

        toast({
          title: 'Following',
          description: `You are now following ${targetUserName || 'this user'}`,
        });
      }

      await fetchFollowStats();
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!user || user.id === targetUserId) {
    // Don't show follow button for own profile or when not logged in
    return showStats ? (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="glass px-3 py-2 rounded-xl">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-white/70" />
            <span className="text-sm font-semibold text-white">
              {formatCount(stats.followersCount)}
            </span>
            <span className="text-xs text-white/70">Followers</span>
          </div>
        </div>
        <div className="glass px-3 py-2 rounded-xl">
          <div className="flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-white/70" />
            <span className="text-sm font-semibold text-white">
              {formatCount(stats.followingCount)}
            </span>
            <span className="text-xs text-white/70">Following</span>
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Follow/Unfollow button */}
      <Button
        onClick={handleFollow}
        disabled={loading}
        className={cn(
          'liquid-button flex items-center gap-2',
          stats.isFollowing && 'bg-gradient-to-r from-gray-600 to-gray-700',
          isAnimating && 'animate-pulse'
        )}
      >
        {stats.isFollowing ? (
          <>
            <UserMinus className="w-4 h-4" />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Follow</span>
          </>
        )}
      </Button>

      {/* Mutual follow indicator */}
      {stats.isFollowedBy && (
        <span className="glass px-2 py-1 rounded-full text-xs text-white/70">
          Follows you
        </span>
      )}

      {/* Follow stats */}
      {showStats && (
        <div className="flex items-center gap-2">
          <button className="glass px-3 py-2 rounded-xl hover:bg-white/20 transition-all">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-white/70" />
              <span className="text-sm font-semibold text-white">
                {formatCount(stats.followersCount)}
              </span>
              <span className="text-xs text-white/70">Followers</span>
            </div>
          </button>
          <button className="glass px-3 py-2 rounded-xl hover:bg-white/20 transition-all">
            <div className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-white/70" />
              <span className="text-sm font-semibold text-white">
                {formatCount(stats.followingCount)}
              </span>
              <span className="text-xs text-white/70">Following</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowSystem;