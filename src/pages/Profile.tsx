
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileLoadingState from '../components/profile/ProfileLoadingState';
import ProfileUnauthenticated from '../components/profile/ProfileUnauthenticated';
import EventsManager from '../components/EventsManager';
import { useProfileData, ProfileData } from '@/hooks/useProfileData';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, saveProfile } = useProfileData(user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <ProfileLoadingState />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <ProfileUnauthenticated />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container py-6 space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <Card>
          <CardHeader className="pb-2">
            <ProfileHeader 
              profile={profile} 
              onSaveProfile={saveProfile} 
            />
          </CardHeader>
          
          <CardContent className="pb-4">
            <ProfileTabs messages={profile.messages || []} />
          </CardContent>
        </Card>

        {/* Events Management Section */}
        <EventsManager />
      </div>
    </div>
  );
};

export default Profile;
