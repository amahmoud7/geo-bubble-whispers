
import React, { useState, useEffect } from 'react';
import MessageDetail from './MessageDetail';
import FilterControls from './FilterControls';
import MessageCard from './MessageCard';
import { useMessageFilter } from '@/hooks/useMessageFilter';
import { mockMessages } from '@/mock/messages';

const ListView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [, setForceUpdate] = useState({});
  
  // Use useEffect to force a re-render when the component mounts
  useEffect(() => {
    // Force update to reflect any changes in mockMessages
    setForceUpdate({});
    
    // Set up an interval to check for updates (simulates real-time updates)
    const intervalId = setInterval(() => {
      setForceUpdate({});
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const {
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    filteredAndSortedMessages,
  } = useMessageFilter(mockMessages);

  const handleSelect = (id: string) => {
    setSelectedMessage(id);
  };

  const handleClose = () => {
    setSelectedMessage(null);
  };

  const handleSortChange = (value: 'recent' | 'expiring') => {
    setSortBy(value);
  };

  return (
    <div className="message-list bg-lo-off-white p-4">
      <FilterControls
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onSearch={setSearchQuery}
      />

      {filteredAndSortedMessages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No messages found.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {filteredAndSortedMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={{
                ...message,
                // Ensure position is always provided (default to 0,0 if not available)
                position: message.position || { x: 0, y: 0 }
              }}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
      
      {selectedMessage && (() => {
        const foundMessage = mockMessages.find(m => m.id === selectedMessage);
        return foundMessage ? (
          <MessageDetail 
            message={foundMessage}
            onClose={handleClose}
          />
        ) : null;
      })()}
    </div>
  );
};

export default ListView;
