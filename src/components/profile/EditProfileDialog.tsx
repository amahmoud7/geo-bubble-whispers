
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProfileForm from "./ProfileForm";

interface ProfileFormData {
  name: string;
  username: string;
  bio: string;
  location: string;
  avatar: string;
}

interface EditProfileDialogProps { 
  profile: ProfileFormData;
  onSave: (data: ProfileFormData) => void;
}

const EditProfileDialog = ({ profile, onSave }: EditProfileDialogProps) => {
  const [formData, setFormData] = useState<ProfileFormData>(profile);
  const [open, setOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(profile.avatar);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (imageDataUrl: string) => {
    setPreviewImage(imageDataUrl);
    setFormData(prev => ({ ...prev, avatar: imageDataUrl }));
  };

  const handleClearImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
    setOpen(false);
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
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ProfileForm
            formData={formData}
            previewImage={previewImage}
            onFormChange={handleChange}
            onImageUpload={handleImageUpload}
            onClearImage={handleClearImage}
          />

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
