
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import MapView from '../components/MapView';
import StoriesBar from '../components/stories/StoriesBar';
import CreateStoryModal from '../components/stories/CreateStoryModal';
import StoryViewer from '../components/stories/StoryViewer';
import EventFetcher from '../components/EventFetcher';
import CreateEventPost from '../components/CreateEventPost';
import { useStories } from '@/hooks/useStories';
import { toast } from '@/hooks/use-toast';

const Home = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');

  const {
    stories,
    userStories,
    isLoading,
    createStory,
    markStoryAsViewed,
    deleteStory,
    fetchStoriesByUser,
  } = useStories();

  const handleStoryClick = (userId: string, storyId: string) => {
    setSelectedUserId(userId);
    setSelectedStoryId(storyId);
    setShowStoryViewer(true);
  };

  const handleCreateStory = () => {
    setShowCreateStory(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Stories Bar */}
      {!isLoading && (stories.length > 0 || userStories.length > 0) && (
        <StoriesBar
          stories={stories}
          userStories={userStories}
          onStoryClick={handleStoryClick}
          onCreateStory={handleCreateStory}
        />
      )}
      
      <MapView />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onCreateStory={createStory}
      />

      {/* Story Viewer */}
      <StoryViewer
        isOpen={showStoryViewer}
        onClose={() => setShowStoryViewer(false)}
        initialUserId={selectedUserId}
        initialStoryId={selectedStoryId}
        stories={stories}
        onMarkAsViewed={markStoryAsViewed}
        onDeleteStory={deleteStory}
        fetchStoriesByUser={fetchStoriesByUser}
      />

      {/* Event Fetcher - triggers automatically on page load */}
      <EventFetcher />
      
      {/* Create Event Post Button */}
      <CreateEventPost />
    </div>
  );
};

export default Home;
