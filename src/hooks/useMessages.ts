
import { useState } from 'react';
import { mockMessages } from '@/mock/messages';

interface Filters {
  showPublic: boolean;
  showFollowers: boolean;
}

export const useMessages = () => {
  const [filters, setFilters] = useState<Filters>({
    showPublic: true,
    showFollowers: true,
  });

  const handleFilterChange = (type: 'showPublic' | 'showFollowers', checked: boolean) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  };

  const filteredMessages = mockMessages.filter(message => {
    if (message.isPublic && filters.showPublic) return true;
    if (!message.isPublic && filters.showFollowers) return true;
    return false;
  });

  return {
    filters,
    filteredMessages,
    handleFilterChange,
  };
};
