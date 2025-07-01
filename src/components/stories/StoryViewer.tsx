import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Story } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId: string;
  initialStoryId: string;
  stories: Story[];
  onMarkAsViewed: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => Promise<boolean>;
  fetchStoriesByUser: (userId: string) => Promise<Story[]>;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  isOpen,
  onClose,
  initialUserId,
  initialStoryId,
  stories,
  onMarkAsViewed,
  onDeleteStory,
  fetchStoriesByUser,
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  // Get unique users from stories
  const uniqueUsers = stories.reduce((acc: Story[], story) => {
    if (!acc.find(s => s.user_id === story.user_id)) {
      acc.push(story);
    }
    return acc;
  }, []);

  useEffect(() => {
    if (isOpen && uniqueUsers.length > 0) {
      const userIndex = uniqueUsers.findIndex(story => story.user_id === initialUserId);
      setCurrentUserIndex(userIndex >= 0 ? userIndex : 0);
    }
  }, [isOpen, initialUserId, uniqueUsers]);

  useEffect(() => {
    if (isOpen && currentUserIndex >= 0 && uniqueUsers[currentUserIndex]) {
      loadUserStories(uniqueUsers[currentUserIndex].user_id);
    }
  }, [isOpen, currentUserIndex, uniqueUsers]);

  useEffect(() => {
    if (userStories.length > 0) {
      const storyIndex = userStories.findIndex(story => story.id === initialStoryId);
      setCurrentStoryIndex(storyIndex >= 0 ? storyIndex : 0);
    }
  }, [userStories, initialStoryId]);

  const loadUserStories = async (userId: string) => {
    const stories = await fetchStoriesByUser(userId);
    setUserStories(stories);
    setCurrentStoryIndex(0);
  };

  const currentStory = userStories[currentStoryIndex];

  useEffect(() => {
    if (currentStory && isOpen) {
      onMarkAsViewed(currentStory.id);
      
      // Auto-advance timer
      setProgress(0);
      const duration = 5000; // 5 seconds per story
      const interval = 50; // Update every 50ms
      const increment = (interval / duration) * 100;
      
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + increment;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [currentStory, isOpen]);

  const handleNext = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < uniqueUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
    }
  };

  const handleDeleteStory = async () => {
    if (currentStory && onDeleteStory) {
      const success = await onDeleteStory(currentStory.id);
      if (success) {
        // Reload user stories after deletion
        await loadUserStories(currentStory.user_id);
        if (userStories.length === 1) {
          // If this was the last story, close viewer
          onClose();
        }
      }
    }
  };

  if (!currentStory) {
    return null;
  }

  const isOwnStory = currentStory.user_id === user?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[90vh] p-0 bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          {/* Progress bars */}
          <div className="flex gap-1 mb-4">
            {userStories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{ 
                    width: index === currentStoryIndex ? `${progress}%` : 
                           index < currentStoryIndex ? '100%' : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentStory.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {currentStory.profiles?.name?.charAt(0) || 
                   currentStory.profiles?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-medium">
                  {currentStory.profiles?.name || currentStory.profiles?.username || 'User'}
                </p>
                <p className="text-xs opacity-70">
                  {new Date(currentStory.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isOwnStory && onDeleteStory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteStory}
                  className="text-white hover:bg-white/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Story content */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentStory.media_url ? (
            currentStory.media_type === 'video' ? (
              <video
                src={currentStory.media_url}
                className="max-w-full max-h-full object-contain"
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="max-w-full max-h-full object-contain"
              />
            )
          ) : (
            <div className="p-8 text-center">
              <p className="text-white text-lg">{currentStory.content}</p>
            </div>
          )}

          {/* Content overlay */}
          {currentStory.content && currentStory.media_url && (
            <div className="absolute bottom-20 left-4 right-4">
              <p className="text-white text-center bg-black/50 rounded-lg p-3">
                {currentStory.content}
              </p>
            </div>
          )}

          {/* Location overlay */}
          {currentStory.location && (
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm text-center opacity-70">
                📍 {currentStory.location}
              </p>
            </div>
          )}

          {/* Navigation areas */}
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-10"
            onClick={handlePrevious}
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-10"
            onClick={handleNext}
          />
        </div>

        {/* Navigation buttons (visible on hover) */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="text-white hover:bg-white/20 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="text-white hover:bg-white/20 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewer;