
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import AvatarUpload from "./AvatarUpload";

interface ProfileAvatarUploaderProps {
  initialImage: string | null;
  onImageChange: (imageDataUrl: string) => void;
  onClearImage: () => void;
}

const ProfileAvatarUploader = ({ 
  initialImage, 
  onImageChange, 
  onClearImage 
}: ProfileAvatarUploaderProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(initialImage);
  const { toast } = useToast();

  const handleImageUpload = (imageDataUrl: string) => {
    setPreviewImage(imageDataUrl);
    onImageChange(imageDataUrl);
  };

  const handleClearImage = () => {
    setPreviewImage(null);
    onClearImage();
  };

  return (
    <div className="flex items-center justify-center pb-4">
      <AvatarUpload
        previewImage={previewImage}
        name=""
        onImageUpload={handleImageUpload}
        onClearImage={handleClearImage}
      />
    </div>
  );
};

export default ProfileAvatarUploader;
