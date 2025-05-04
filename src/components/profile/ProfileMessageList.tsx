
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { Message } from '@/types/database';

interface ProfileMessageListProps {
  messages: Message[];
}

const ProfileMessageList = ({ messages }: ProfileMessageListProps) => {
  return (
    <>
      {messages.map((message) => (
        <Card key={message.id} className="overflow-hidden">
          <CardContent className="p-0">
            {message.mediaUrl && (
              <div className="w-full h-48 bg-gray-100 relative">
                <img 
                  src={message.mediaUrl} 
                  alt={message.content}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={message.is_public ? "default" : "secondary"}>
                    {message.is_public ? 'Public' : 'Followers'}
                  </Badge>
                </div>
              </div>
            )}
            <div className="p-4">
              <p className="mb-2">{message.content}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{message.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default ProfileMessageList;
