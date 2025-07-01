
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import EditProfileDialog from './EditProfileDialog';
import { ProfileData } from '@/hooks/useProfileData';

interface ProfileHeaderProps {
  profile: {
    name: string;
    username: string;
    bio: string;
    location: string;
    avatar: string;
    followers?: number;
    following?: number;
  };
  onSaveProfile: (data: ProfileData) => Promise<boolean>;
}

const ProfileHeader = ({ profile, onSaveProfile }: ProfileHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-start">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback>{profile.name?.charAt(0) || profile.username?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <EditProfileDialog 
          profile={{
            name: profile.name,
            username: profile.username,
            bio: profile.bio,
            location: profile.location,
            avatar: profile.avatar
          }}
          onSave={onSaveProfile}
        />
      </div>
      
      <CardTitle className="mt-4">{profile.name}</CardTitle>
      <CardDescription>@{profile.username}</CardDescription>
      
      <p className="mb-4 mt-4">{profile.bio}</p>
      
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
    </>
  );
};

export default ProfileHeader;
