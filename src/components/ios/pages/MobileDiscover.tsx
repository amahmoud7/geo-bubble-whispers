import React, { useState } from 'react';
import { Search, Filter, MapPin, Clock, Heart } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import MobileHeader from '../MobileHeader';
import TouchableArea from '../TouchableArea';
import { MobileInput, SegmentedControl } from '../MobileForm';
import BottomSheet from '../BottomSheet';

const MobileDiscover: React.FC = () => {
  const { filteredMessages, filters, handleFilterChange } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'nearby'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filteredBySearch = filteredMessages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMessages = [...filteredBySearch].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'popular':
        return (b.likes_count || 0) - (a.likes_count || 0);
      case 'nearby':
        // For now, just sort by recent. In real app, would calculate distance
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="h-full flex flex-col ios-bg-grouped">
      <MobileHeader
        title="Discover"
        leftButton="none"
        rightButton={
          <TouchableArea onPress={() => setShowFilters(true)}>
            <Filter size={24} className="text-blue-600" />
          </TouchableArea>
        }
      />

      <div className="flex-1 overflow-hidden">
        {/* Search and Sort Controls */}
        <div className="px-4 py-3 ios-bg-system">
          <MobileInput
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} />}
            className="mb-3"
          />
          
          <SegmentedControl
            options={[
              { label: 'Recent', value: 'recent' },
              { label: 'Popular', value: 'popular' },
              { label: 'Nearby', value: 'nearby' }
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value as typeof sortBy)}
          />
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {sortedMessages.map((message) => (
            <TouchableArea
              key={message.id}
              className="ios-card p-4"
            >
              <div className="flex items-start gap-3">
                <img
                  src={message.avatar_url || '/placeholder.svg'}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full bg-gray-200"
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold ios-label">
                      {message.username || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-1 ios-tertiary-label">
                      <Clock size={12} />
                      <span className="ios-caption-1">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="ios-body ios-label mb-2">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 ios-secondary-label">
                      <MapPin size={12} />
                      <span className="ios-caption-1">
                        {message.location_name || 'Unknown location'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="ios-red" />
                        <span className="ios-caption-1 ios-secondary-label">
                          {message.likes_count || 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="ios-caption-1 ios-secondary-label">
                          {message.comments_count || 0} replies
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TouchableArea>
          ))}
          
          {sortedMessages.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto ios-quaternary-label mb-4" />
              <h3 className="ios-title-3 ios-secondary-label mb-2">
                No messages found
              </h3>
              <p className="ios-body ios-tertiary-label">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        snapPoints={[0.5, 0.8]}
      >
        <div className="px-4 pb-4 space-y-6">
          <div>
            <h4 className="ios-headline ios-label mb-3">Message Type</h4>
            <div className="space-y-2">
              {['all', 'text', 'image', 'video', 'live'].map((type) => (
                <TouchableArea
                  key={type}
                  onPress={() => handleFilterChange('type', type as any)}
                  className="ios-list-item justify-between"
                >
                  <span className="ios-body capitalize">{type}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    filters.type === type 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {filters.type === type && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                </TouchableArea>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="ios-headline ios-label mb-3">Privacy</h4>
            <div className="space-y-2">
              {['all', 'public', 'friends', 'private'].map((privacy) => (
                <TouchableArea
                  key={privacy}
                  onPress={() => handleFilterChange('privacy', privacy as any)}
                  className="ios-list-item justify-between"
                >
                  <span className="ios-body capitalize">{privacy}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    filters.privacy === privacy 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {filters.privacy === privacy && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                </TouchableArea>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default MobileDiscover;