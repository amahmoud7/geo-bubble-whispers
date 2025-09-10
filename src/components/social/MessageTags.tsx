import React, { useState, useEffect } from 'react';
import { Hash, Tag, X, Plus, TrendingUp, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MessageTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  count?: number;
}

interface MessageTagsProps {
  messageId?: string;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  mode?: 'display' | 'edit' | 'filter';
  className?: string;
}

const predefinedTags: MessageTag[] = [
  { id: 'food', name: 'Food', color: 'bg-gradient-to-r from-orange-400 to-red-400', icon: '🍔' },
  { id: 'event', name: 'Event', color: 'bg-gradient-to-r from-purple-400 to-pink-400', icon: '🎉' },
  { id: 'nightlife', name: 'Nightlife', color: 'bg-gradient-to-r from-indigo-400 to-purple-400', icon: '🌃' },
  { id: 'nature', name: 'Nature', color: 'bg-gradient-to-r from-green-400 to-teal-400', icon: '🌳' },
  { id: 'sports', name: 'Sports', color: 'bg-gradient-to-r from-blue-400 to-cyan-400', icon: '⚽' },
  { id: 'music', name: 'Music', color: 'bg-gradient-to-r from-pink-400 to-rose-400', icon: '🎵' },
  { id: 'art', name: 'Art', color: 'bg-gradient-to-r from-yellow-400 to-orange-400', icon: '🎨' },
  { id: 'shopping', name: 'Shopping', color: 'bg-gradient-to-r from-teal-400 to-green-400', icon: '🛍️' },
  { id: 'travel', name: 'Travel', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: '✈️' },
  { id: 'tech', name: 'Tech', color: 'bg-gradient-to-r from-gray-400 to-gray-600', icon: '💻' },
];

const MessageTags: React.FC<MessageTagsProps> = ({
  messageId,
  selectedTags = [],
  onTagsChange,
  mode = 'display',
  className
}) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<string[]>(selectedTags);
  const [customTag, setCustomTag] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  useEffect(() => {
    if (messageId && mode === 'display') {
      fetchMessageTags();
    }
    if (mode === 'filter') {
      fetchTrendingTags();
    }
  }, [messageId, mode]);

  const fetchMessageTags = async () => {
    if (!messageId) return;

    const { data, error } = await supabase
      .from('message_tags')
      .select('tag')
      .eq('message_id', messageId);

    if (error) {
      console.error('Error fetching message tags:', error);
      return;
    }

    if (data) {
      setTags(data.map(t => t.tag));
    }
  };

  const fetchTrendingTags = async () => {
    // Get tags from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('message_tags')
      .select('tag')
      .gte('created_at', yesterday);

    if (error) {
      console.error('Error fetching trending tags:', error);
      return;
    }

    if (data) {
      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      data.forEach(t => {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      });

      // Sort by count and take top 10
      const trending = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTrendingTags(trending);
    }
  };

  const handleAddTag = async (tagName: string) => {
    if (!tagName || tags.includes(tagName)) return;

    const newTags = [...tags, tagName];
    setTags(newTags);
    onTagsChange?.(newTags);

    setIsAnimating(tagName);
    setTimeout(() => setIsAnimating(null), 600);

    if (messageId && user) {
      try {
        const { error } = await supabase
          .from('message_tags')
          .insert({
            message_id: messageId,
            user_id: user.id,
            tag: tagName
          });

        if (error) throw error;

        toast({
          title: 'Tag added',
          description: `Added #${tagName} to this Lo`,
        });
      } catch (error) {
        console.error('Error adding tag:', error);
        toast({
          title: 'Error',
          description: 'Failed to add tag',
          variant: 'destructive'
        });
      }
    }

    setCustomTag('');
    setShowTagPicker(false);
  };

  const handleRemoveTag = async (tagName: string) => {
    const newTags = tags.filter(t => t !== tagName);
    setTags(newTags);
    onTagsChange?.(newTags);

    if (messageId && user) {
      try {
        const { error } = await supabase
          .from('message_tags')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('tag', tagName);

        if (error) throw error;

        toast({
          title: 'Tag removed',
          description: `Removed #${tagName} from this Lo`,
        });
      } catch (error) {
        console.error('Error removing tag:', error);
      }
    }
  };

  const getTagStyle = (tagName: string): string => {
    const predefined = predefinedTags.find(t => t.id === tagName || t.name === tagName);
    return predefined?.color || 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const getTagIcon = (tagName: string): string | undefined => {
    const predefined = predefinedTags.find(t => t.id === tagName || t.name === tagName);
    return predefined?.icon;
  };

  const filteredTags = predefinedTags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !tags.includes(tag.id)
  );

  if (mode === 'display') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {tags.map(tag => (
          <span
            key={tag}
            className={cn(
              'px-3 py-1 rounded-full text-white text-sm flex items-center gap-1',
              getTagStyle(tag),
              isAnimating === tag && 'animate-bounce'
            )}
          >
            {getTagIcon(tag) && <span>{getTagIcon(tag)}</span>}
            <Hash className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (mode === 'filter') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="glass-input pl-10"
          />
        </div>

        {/* Trending tags */}
        {trendingTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/70">Trending</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (tags.includes(tag)) {
                      handleRemoveTag(tag);
                    } else {
                      handleAddTag(tag);
                    }
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-all',
                    tags.includes(tag)
                      ? cn('text-white', getTagStyle(tag))
                      : 'glass text-white/70 hover:text-white'
                  )}
                >
                  {getTagIcon(tag) && <span>{getTagIcon(tag)}</span>}
                  <Hash className="w-3 h-3" />
                  {tag}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected tags */}
        {tags.length > 0 && (
          <div>
            <span className="text-sm text-white/70">Selected</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className={cn(
                    'px-3 py-1 rounded-full text-white text-sm flex items-center gap-1',
                    getTagStyle(tag)
                  )}
                >
                  {getTagIcon(tag) && <span>{getTagIcon(tag)}</span>}
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className={cn(
              'px-3 py-1 rounded-full text-white text-sm flex items-center gap-1',
              getTagStyle(tag),
              isAnimating === tag && 'animate-bounce'
            )}
          >
            {getTagIcon(tag) && <span>{getTagIcon(tag)}</span>}
            <Hash className="w-3 h-3" />
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        {/* Add tag button */}
        <button
          onClick={() => setShowTagPicker(!showTagPicker)}
          className="glass px-3 py-1 rounded-full text-sm flex items-center gap-1 hover:bg-white/20 transition-all"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* Tag picker */}
      {showTagPicker && (
        <div className="glass-heavy rounded-xl p-3 space-y-3 animate-fade-in">
          {/* Search/Custom tag input */}
          <div className="flex gap-2">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && customTag) {
                  handleAddTag(customTag);
                }
              }}
              placeholder="Type custom tag..."
              className="glass-input flex-1"
            />
            <Button
              onClick={() => customTag && handleAddTag(customTag)}
              disabled={!customTag || tags.includes(customTag)}
              className="liquid-button"
            >
              Add
            </Button>
          </div>

          {/* Predefined tags */}
          <div className="grid grid-cols-2 gap-2">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag.id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-white text-sm flex items-center gap-2 transition-all',
                  getTagStyle(tag.id),
                  'hover:scale-105'
                )}
              >
                <span className="text-lg">{tag.icon}</span>
                <span>{tag.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTags;