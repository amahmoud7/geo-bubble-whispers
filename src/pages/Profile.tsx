
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileLoadingState from '../components/profile/ProfileLoadingState';
import ProfileUnauthenticated from '../components/profile/ProfileUnauthenticated';

// Interface for profile data
interface ProfileData {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  followers?: number;
  following?: number;
  messages?: any[];
}

// Initial profile data for new users
const defaultProfile: ProfileData = {
  name: '',
  username: '',
  avatar: '',
  bio: '',
  location: '',
  followers: 0,
  following: 0,
  messages: [],
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user profile on component mount
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch profile data from Supabase
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Format the profile data
      setProfile({
        name: profileData.name || '',
        username: profileData.username || '',
        avatar: profileData.avatar_url || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        followers: 0,
        following: 0,
        messages: [], // We'll fetch messages separately
      });

      // Fetch messages (in a real app, this would be a separate query)
      fetchUserMessages(userId);

    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserMessages = async (userId: string) => {
    // In a real app, we would fetch messages from the database
    // For now, we'll use mock data
    setProfile(prev => ({
      ...prev,
      messages: [
        {
          id: '101',
          content: 'Found this amazing food market today! Worth checking out.',
          location: 'Ferry Building, San Francisco',
          timestamp: '2023-05-10T14:30:00Z',
          isPublic: true,
          mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
        },
        {
          id: '102',
          content: 'Beautiful sunset over the Golden Gate Bridge today!',
          location: 'Crissy Field, San Francisco',
          timestamp: '2023-05-08T19:45:00Z',
          isPublic: true,
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        },
      ]
    }));
  };

  const handleSaveProfile = async (updatedProfileData: any) => {
    try {
      if (!user) return;
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedProfileData.name,
          username: updatedProfileData.username,
          bio: updatedProfileData.bio,
          location: updatedProfileData.location,
          avatar_url: updatedProfileData.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update the local state
      setProfile({
        ...profile,
        name: updatedProfileData.name,
        username: updatedProfileData.username,
        bio: updatedProfileData.bio,
        location: updatedProfileData.location,
        avatar: updatedProfileData.avatar,
      });
      
      toast({
        title: "Success",
        description: "Profile has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive"
      });
    }
  };

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
      
      <div className="container py-6">
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
              onSaveProfile={handleSaveProfile} 
            />
          </CardHeader>
          
          <CardContent className="pb-4">
            <ProfileTabs messages={profile.messages || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
