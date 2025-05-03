
import React, { useRef, ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  previewImage: string | null;
  name: string;
  onImageUpload: (imageDataUrl: string) => void;
  onClearImage: () => void;
}

const AvatarUpload = ({ previewImage, name, onImageUpload, onClearImage }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent trigger of parent click handler
    onClearImage();
  };

  return (
    <div className="relative cursor-pointer" onClick={handleImageClick}>
      <Avatar className="h-24 w-24">
        {previewImage ? (
          <AvatarImage src={previewImage} />
        ) : (
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
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
  );
};

export default AvatarUpload;
