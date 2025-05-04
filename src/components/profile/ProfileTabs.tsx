
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from 'lucide-react';
import ProfileMessageList from './ProfileMessageList';
import { Message } from '@/types/database';

interface ProfileTabsProps {
  messages: Message[];
}

const EmptyState = ({ title, description }: { title: string, description: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <User className="h-10 w-10 text-muted-foreground mb-2" />
    <h3 className="font-medium mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">
      {description}
    </p>
  </div>
);

const ProfileTabs = ({ messages }: ProfileTabsProps) => {
  return (
    <Tabs defaultValue="messages">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
        <TabsTrigger value="expired" className="flex-1">Expired</TabsTrigger>
        <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
      </TabsList>
      
      <TabsContent value="messages" className="space-y-4">
        {messages && messages.length > 0 ? (
          <ProfileMessageList messages={messages} />
        ) : (
          <EmptyState 
            title="No messages yet" 
            description="Your messages will appear here" 
          />
        )}
      </TabsContent>
      
      <TabsContent value="expired">
        <EmptyState 
          title="No expired messages" 
          description="Messages will appear here after they expire" 
        />
      </TabsContent>
      
      <TabsContent value="saved">
        <EmptyState 
          title="No saved messages" 
          description="Messages you save will appear here" 
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
