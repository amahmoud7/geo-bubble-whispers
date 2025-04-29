
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image, X } from 'lucide-react';

interface MediaUploadProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSelection: () => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  selectedFile,
  previewUrl,
  onFileChange,
  onClearSelection,
}) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="media">Media (optional)</Label>
      
      {previewUrl ? (
        <div className="relative mt-2 h-48 w-full rounded-md overflow-hidden bg-gray-100">
          <img
            src={previewUrl}
            alt="Selected media"
            className="h-full w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center mt-2">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <Image className="h-6 w-6 text-gray-400" />
              <span className="mt-2 block text-sm font-medium">
                Click to upload an image or video
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
