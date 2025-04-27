
import React, { useState } from 'react';
import MessageDetail from './MessageDetail';
import FilterControls from './FilterControls';
import MessageCard from './MessageCard';
import { useMessageFilter } from '@/hooks/useMessageFilter';
import { mockMessages } from '@/mock/messages';

const ListView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
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

  return (
    <div className="message-list bg-lo-off-white">
      <FilterControls
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onSearch={setSearchQuery}
      />

      <div className="space-y-4 pb-4">
        {filteredAndSortedMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            onSelect={handleSelect}
          />
        ))}
      </div>
      
      {selectedMessage && (
        <MessageDetail 
          message={mockMessages.find(m => m.id === selectedMessage)!}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default ListView;
