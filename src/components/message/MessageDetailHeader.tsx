
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, X } from 'lucide-react';

interface MessageDetailHeaderProps {
  user: {
    name: string;
    avatar: string;
  };
  location: string;
  isPublic: boolean;
  onClose: () => void;
}

const MessageDetailHeader: React.FC<MessageDetailHeaderProps> = ({
  user,
  location,
  isPublic,
  onClose
}) => {
  return (
    <div className="p-4 pb-2 flex flex-row items-start justify-between">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
          <AvatarImage 
            src={user.avatar} 
            alt={user.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-base">{user.name}</p>
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
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 -mr-2">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageDetailHeader;
