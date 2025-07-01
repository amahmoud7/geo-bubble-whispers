import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Story } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface StoriesBarProps {
  stories: Story[];
  userStories: Story[];
  onStoryClick: (userId: string, storyId: string) => void;
  onCreateStory: () => void;
}

const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  userStories,
  onStoryClick,
  onCreateStory,
}) => {
  const { user } = useAuth();

  // Filter out current user's stories from the general stories list
  const otherUsersStories = stories.filter(story => story.user_id !== user?.id);

  return (
    <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide bg-background border-b">
      {/* Current user's story or add story button */}
      <div className="flex flex-col items-center gap-2 min-w-[80px]">
        <div className="relative">
          {userStories.length > 0 ? (
            <button
              onClick={() => onStoryClick(user!.id, userStories[0].id)}
              className="relative"
            >
              <Avatar className="w-16 h-16 ring-2 ring-primary ring-offset-2">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.user_metadata?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Button
              onClick={onCreateStory}
              className="w-16 h-16 rounded-full p-0 bg-muted hover:bg-muted/80"
              variant="outline"
            >
              <Plus className="w-6 h-6" />
            </Button>
          )}
        </div>
        <span className="text-xs text-center truncate w-full">
          {userStories.length > 0 ? 'Your Story' : 'Your Story'}
        </span>
      </div>

      {/* Other users' stories */}
      {otherUsersStories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-2 min-w-[80px]">
          <button
            onClick={() => onStoryClick(story.user_id, story.id)}
            className="relative"
          >
            <Avatar className="w-16 h-16 ring-2 ring-primary ring-offset-2">
              <AvatarImage src={story.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                {story.profiles?.name?.charAt(0) || 
                 story.profiles?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
          <span className="text-xs text-center truncate w-full">
            {story.profiles?.name || story.profiles?.username || 'User'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StoriesBar;
