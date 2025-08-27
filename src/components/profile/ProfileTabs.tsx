
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, List, Calendar, Bookmark } from 'lucide-react';
import ProfileMessageList from './ProfileMessageList';
import ProfileGallery from './ProfileGallery';
import { Message } from '@/types/database';

interface ProfileTabsProps {
  messages: Message[];
  savedMessages?: Message[];
  eventMessages?: Message[];
  onMessageClick?: (message: Message) => void;
}

const EmptyState = ({ title, description, icon: Icon = Grid3X3 }: { 
  title: string; 
  description: string; 
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="font-medium mb-2 text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      {description}
    </p>
  </div>
);

const ProfileTabs = ({ 
  messages, 
  savedMessages = [], 
  eventMessages = [], 
  onMessageClick 
}: ProfileTabsProps) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const regularMessages = messages.filter(msg => msg.media_type !== 'event');
  const expiredMessages = messages.filter(msg => 
    msg.expires_at && new Date(msg.expires_at) < new Date()
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1 flex items-center space-x-1">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1 flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 flex items-center space-x-1">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
          </TabsTrigger>
        </TabsList>

        {/* View mode toggle for posts */}
        <div className="flex justify-end mt-4 mb-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <TabsContent value="posts" className="mt-0">
          {regularMessages && regularMessages.length > 0 ? (
            viewMode === 'grid' ? (
              <ProfileGallery 
                messages={regularMessages} 
                onMessageClick={onMessageClick}
              />
            ) : (
              <ProfileMessageList messages={regularMessages} />
            )
          ) : (
            <EmptyState 
              title="No posts yet" 
              description="Your location-based posts will appear here. Share your experiences to get started!"
              icon={Grid3X3}
            />
          )}
        </TabsContent>
        
        <TabsContent value="events" className="mt-0">
          {eventMessages && eventMessages.length > 0 ? (
            viewMode === 'grid' ? (
              <ProfileGallery 
                messages={eventMessages} 
                onMessageClick={onMessageClick}
              />
            ) : (
              <ProfileMessageList messages={eventMessages} />
            )
          ) : (
            <EmptyState 
              title="No events yet" 
              description="Events you create or join will appear here"
              icon={Calendar}
            />
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="mt-0">
          {savedMessages && savedMessages.length > 0 ? (
            viewMode === 'grid' ? (
              <ProfileGallery 
                messages={savedMessages} 
                onMessageClick={onMessageClick}
              />
            ) : (
              <ProfileMessageList messages={savedMessages} />
            )
          ) : (
            <EmptyState 
              title="No saved posts" 
              description="Posts you save will appear here for easy access later"
              icon={Bookmark}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
