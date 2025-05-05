
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProfileForm from "./ProfileForm";
import ProfileFormSubmitter from "./ProfileFormSubmitter";
import ProfileAvatarUploader from "./ProfileAvatarUploader";
import { ProfileData } from '@/hooks/useProfileData';

interface EditProfileDialogProps { 
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
}

const EditProfileDialog = ({ profile, onSave }: EditProfileDialogProps) => {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (imageDataUrl: string) => {
    setFormData(prev => ({ ...prev, avatar: imageDataUrl }));
  };

  const handleClearImage = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {      
      // Update the profile through the parent component
      const success = await onSave(formData);
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
        
        setOpen(false);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ProfileAvatarUploader 
            initialImage={profile.avatar} 
            onImageChange={handleImageUpload}
            onClearImage={handleClearImage}
          />
          
          <ProfileForm
            formData={formData}
            onFormChange={handleChange}
          />

          <ProfileFormSubmitter isLoading={isLoading} />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
