
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AvatarUpload from "./AvatarUpload";

interface ProfileFormData {
  name: string;
  username: string;
  bio: string;
  location: string;
  avatar: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  previewImage: string | null;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageUpload: (imageDataUrl: string) => void;
  onClearImage: () => void;
}

const ProfileForm = ({
  formData,
  previewImage,
  onFormChange,
  onImageUpload,
  onClearImage
}: ProfileFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center pb-4">
        <AvatarUpload
          previewImage={previewImage}
          name={formData.name}
          onImageUpload={onImageUpload}
          onClearImage={onClearImage}
        />
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onFormChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={onFormChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={onFormChange}
            className="resize-none"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={onFormChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
