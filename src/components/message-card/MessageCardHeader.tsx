
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface MessageCardHeaderProps {
  user: {
    name: string;
    avatar: string;
  };
  location: string;
  isPublic: boolean;
  timestamp: string;
}

const MessageCardHeader: React.FC<MessageCardHeaderProps> = ({
  user,
  location,
  isPublic,
  timestamp
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 pb-0 flex flex-row items-start justify-between">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
          <AvatarImage 
            src={user.avatar} 
            alt={user.name.charAt(0)}
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user.name}</p>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{location}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Badge variant={isPublic ? "default" : "secondary"}>
          {isPublic ? 'Public' : 'Followers'}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimestamp(timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageCardHeader;
