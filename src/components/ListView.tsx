
import React, { useState, useEffect } from 'react';
import MessageDetail from './MessageDetail';
import FilterControls from './FilterControls';
import MessageCard from './MessageCard';
import { useMessageFilter } from '@/hooks/useMessageFilter';
import { useMessages } from '@/hooks/useMessages';

const ListView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const { filteredMessages } = useMessages();
  
  const {
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    filteredAndSortedMessages,
  } = useMessageFilter(filteredMessages);

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
        const foundMessage = filteredMessages.find(m => m.id === selectedMessage);
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
