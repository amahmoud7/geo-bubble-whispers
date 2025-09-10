import React, { useState, useEffect } from 'react';
import { Heart, Laugh, Sparkles, Flame, ThumbsUp, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/services/pushNotifications';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  user_id: string;
  message_id: string;
  emoji: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface MessageReactionsProps {
  messageId: string;
  messageUserId?: string;
  messageContent?: string;
  className?: string;
}

const reactionEmojis = [
  { emoji: '❤️', icon: Heart, label: 'Love', color: 'text-red-500' },
  { emoji: '😂', icon: Laugh, label: 'Funny', color: 'text-yellow-500' },
  { emoji: '✨', icon: Sparkles, label: 'Amazing', color: 'text-purple-500' },
  { emoji: '🔥', icon: Flame, label: 'Hot', color: 'text-orange-500' },
  { emoji: '👍', icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
];

const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  messageUserId,
  messageContent,
  className 
}) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();
    subscribeToReactions();
  }, [messageId]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('message_reactions')
      .select(`
        *,
        profiles:user_id (
          name,
          avatar_url
        )
      `)
      .eq('message_id', messageId);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    if (data) {
      setReactions(data);
      updateReactionCounts(data);
      
      // Check if current user has reacted
      if (user) {
        const userReactionData = data.find(r => r.user_id === user.id);
        setUserReaction(userReactionData?.emoji || null);
      }
    }
  };

  const updateReactionCounts = (reactionsList: Reaction[]) => {
    const counts: Record<string, number> = {};
    reactionsList.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    setReactionCounts(counts);
  };

  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleReaction = async (emoji: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to react to messages',
        variant: 'destructive'
      });
      return;
    }

    setIsAnimating(emoji);
    setTimeout(() => setIsAnimating(null), 600);

    try {
      if (userReaction === emoji) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setUserReaction(null);
        toast({
          title: 'Reaction removed',
          description: 'Your reaction has been removed',
        });
      } else {
        // Add or update reaction
        const { error } = await supabase
          .from('message_reactions')
          .upsert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji
          }, {
            onConflict: 'message_id,user_id'
          });

        if (error) throw error;

        setUserReaction(emoji);
        
        // Send notification to message owner
        if (messageUserId && messageUserId !== user.id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            pushNotificationService.sendReactionNotification({
              userId: user.id,
              userName: userData.name || 'Someone',
              emoji: emoji,
              messageContent: messageContent || 'your message'
            });
          }
        }

        toast({
          title: 'Reaction added',
          description: `You reacted with ${emoji}`,
        });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive'
      });
    }

    setShowReactionPicker(false);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Reaction counts display */}
      <div className="flex items-center gap-1">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className={cn(
              'glass px-2 py-1 rounded-full flex items-center gap-1 transition-all',
              userReaction === emoji && 'ring-2 ring-blue-500 bg-blue-500/20',
              isAnimating === emoji && 'animate-bounce'
            )}
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-xs text-white/70">{count}</span>
          </button>
        ))}
      </div>

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="glass p-2 rounded-full hover:bg-white/20 transition-all"
        >
          <Heart className="w-4 h-4 text-white/70" />
        </button>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div className="absolute bottom-full mb-2 left-0 glass-heavy rounded-2xl p-2 flex gap-1 animate-fade-in">
            {reactionEmojis.map(({ emoji, icon: Icon, label, color }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={cn(
                  'p-2 rounded-xl hover:bg-white/20 transition-all group relative',
                  userReaction === emoji && 'bg-white/20'
                )}
                title={label}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 glass px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reaction animation particles */}
      {isAnimating && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: '20%',
                animationDelay: `${i * 0.1}s`
              }}
            >
              <span className="text-3xl">{isAnimating}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-50px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MessageReactions;