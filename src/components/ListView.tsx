import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Filter, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MessageDetail from './MessageDetail';
import SearchBar from './SearchBar';

const mockMessages = [
  {
    id: '1',
    position: { x: '30%', y: '40%' },
    user: {
      name: 'Alex Smith',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Just spotted a great street performance here! 🎸',
    mediaUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
    isPublic: true,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 82800000).toISOString(),
    location: 'Central Park, New York',
  },
  {
    id: '2',
    position: { x: '70%', y: '20%' },
    user: {
      name: 'Jordan Lee',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'This coffee shop has the best latte in town! ☕️',
    mediaUrl: '',
    isPublic: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: new Date(Date.now() + 79200000).toISOString(),
    location: 'Downtown, Seattle',
  },
  {
    id: '3',
    position: { x: '50%', y: '60%' },
    user: {
      name: 'Taylor Swift',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Amazing sunset view from this spot! 🌅',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    isPublic: false,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    expiresAt: new Date(Date.now() + 75600000).toISOString(),
    location: 'Malibu Beach, California',
  },
  {
    id: '4',
    position: { x: '40%', y: '30%' },
    user: {
      name: 'Jamie Wilson',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Found this hidden gem of a bookstore! 📚',
    mediaUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff',
    isPublic: true,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    expiresAt: new Date(Date.now() + 72000000).toISOString(),
    location: 'Greenwich Village, New York',
  },
  {
    id: '5',
    position: { x: '60%', y: '70%' },
    user: {
      name: 'Riley Johnson',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Best taco truck ever parked here right now! 🌮',
    mediaUrl: '',
    isPublic: false,
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    expiresAt: new Date(Date.now() + 68400000).toISOString(),
    location: 'Venice Beach, Los Angeles',
  },
];

const ListView: React.FC = () => {
  const [filters, setFilters] = useState({
    showPublic: true,
    showFollowers: true,
  });
  const [sortBy, setSortBy] = useState('recent');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (id: string) => {
    setSelectedMessage(id);
  };

  const handleClose = () => {
    setSelectedMessage(null);
  };

  const filteredAndSortedMessages = [...mockMessages]
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
      } else if (sortBy === 'expiring') {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
      return 0;
    });

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="message-list bg-lo-off-white">
      <div className="flex flex-col gap-4 mb-4 sticky top-0 bg-lo-off-white p-2 z-10">
        <SearchBar onSearch={setSearchQuery} />
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={filters.showPublic}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, showPublic: checked as boolean }))
                  }
                >
                  Public Messages
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.showFollowers}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, showFollowers: checked as boolean }))
                  }
                >
                  Follower Messages
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pb-4">
        {filteredAndSortedMessages.map((message) => (
          <Card key={message.id} className="slide-up">
            <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={message.user.avatar} />
                  <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{message.user.name}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{message.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant={message.isPublic ? "default" : "secondary"}>
                  {message.isPublic ? 'Public' : 'Followers'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-3">
              <p className="mb-2">{message.content}</p>
              {message.mediaUrl && (
                <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100">
                  <img
                    src={message.mediaUrl}
                    alt="Message media"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{getTimeRemaining(message.expiresAt)} left</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleSelect(message.id)}>
                View
              </Button>
            </CardFooter>
          </Card>
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
