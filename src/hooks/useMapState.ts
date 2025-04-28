
import { useState } from 'react';
import { mockMessages } from '@/mock/messages';

export const useMapState = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    showPublic: true,
    showFollowers: true,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.0060
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
    selectedMessage,
    setSelectedMessage,
    isCreating,
    setIsCreating,
    filters,
    userLocation,
    setUserLocation,
    handleFilterChange,
    filteredMessages,
  };
};
