import { useState } from 'react';

interface MessageFilter {
  showPublic: boolean;
  showFollowers: boolean;
}

interface Message {
  id: string;
  content: string;
  location: string;
  user: {
    name: string;
    avatar: string;
  };
  isPublic: boolean;
  timestamp: string;
  expiresAt: string;
  mediaUrl?: string;
  position?: {
    x: number;
    y: number;
  };
}

export const useMessageFilter = (messages: Message[]) => {
  const [filters, setFilters] = useState<MessageFilter>({
    showPublic: true,
    showFollowers: true,
  });
  const [sortBy, setSortBy] = useState<'recent' | 'expiring'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedMessages = messages
    .filter(message => {
      if (!(message.isPublic && filters.showPublic) && !(!message.isPublic && filters.showFollowers)) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          message.content.toLowerCase().includes(query) ||
          message.location.toLowerCase().includes(query) ||
          message.user.name.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
    });

  return {
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    filteredAndSortedMessages,
  };
};
