
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import EditProfileDialog from '../components/profile/EditProfileDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, User, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
      // This just uses the mock data for now
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
        <div className="flex items-center justify-center flex-grow">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="container py-6 flex flex-col items-center justify-center flex-grow">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-muted-foreground mb-4">You need to be signed in to view your profile.</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
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
            <div className="flex justify-between items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <EditProfileDialog 
                profile={{
                  name: profile.name,
                  username: profile.username,
                  bio: profile.bio,
                  location: profile.location,
                  avatar: profile.avatar
                }}
                onSave={handleSaveProfile}
              />
            </div>
            
            <CardTitle className="mt-4">{profile.name}</CardTitle>
            <CardDescription>@{profile.username}</CardDescription>
          </CardHeader>
          
          <CardContent className="pb-4">
            <p className="mb-4">{profile.bio}</p>
            
            {profile.location && (
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{profile.location}</span>
              </div>
            )}
            
            <div className="flex gap-4 text-sm mb-6">
              <div>
                <span className="font-bold">{profile.following}</span> Following
              </div>
              <div>
                <span className="font-bold">{profile.followers}</span> Followers
              </div>
            </div>
            
            <Tabs defaultValue="messages">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
                <TabsTrigger value="expired" className="flex-1">Expired</TabsTrigger>
                <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
              </TabsList>
              
              <TabsContent value="messages" className="space-y-4">
                {profile.messages && profile.messages.length > 0 ? (
                  profile.messages.map((message) => (
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
                              <Badge variant={message.isPublic ? "default" : "secondary"}>
                                {message.isPublic ? 'Public' : 'Followers'}
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
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <User className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium mb-1">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Your messages will appear here
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="expired">
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <User className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium mb-1">No expired messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Messages will appear here after they expire
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="saved">
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <User className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium mb-1">No saved messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Messages you save will appear here
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
