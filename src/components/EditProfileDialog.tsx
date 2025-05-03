
import React, { useState, useRef, ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileFormData {
  name: string;
  username: string;
  bio: string;
  location: string;
  avatar: string;
}

const EditProfileDialog = ({ 
  profile,
  onSave 
}: { 
  profile: ProfileFormData;
  onSave: (data: ProfileFormData) => void;
}) => {
  const [formData, setFormData] = useState<ProfileFormData>(profile);
  const [open, setOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(profile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, or WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      setFormData(prev => ({ ...prev, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent trigger of parent click handler
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
          <div className="flex items-center justify-center pb-4">
            <div className="relative cursor-pointer" onClick={handleImageClick}>
              <Avatar className="h-24 w-24">
                {previewImage ? (
                  <AvatarImage src={previewImage} />
                ) : (
                  <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
              
              {previewImage && (
                <button 
                  type="button"
                  className="absolute -top-2 -right-2 rounded-full bg-destructive p-1"
                  onClick={handleClearImage}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden" 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
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
                onChange={handleChange}
              />
            </div>
          </div>

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
