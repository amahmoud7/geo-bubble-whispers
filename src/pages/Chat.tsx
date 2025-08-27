import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ChatInterface } from '@/components/messaging/ChatInterface';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/navigation/BottomNavigation';

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!conversationId) {
    return <Navigate to="/inbox" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-16 pb-20 h-screen flex flex-col">
        <ChatInterface 
          conversationId={conversationId} 
          className="flex-1"
        />
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Chat;