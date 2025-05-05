
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image, X, Upload } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <Label htmlFor="media">Media (optional)</Label>
        {selectedFile && (
          <span className="text-xs text-muted-foreground">
            {selectedFile.name.length > 20 
              ? `${selectedFile.name.substring(0, 20)}...` 
              : selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
          </span>
        )}
      </div>
      
      {previewUrl ? (
        <div className="relative mt-2 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
          <div className="aspect-video relative">
            <img
              src={previewUrl}
              alt="Selected media"
              className="h-full w-full object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90 hover:opacity-100"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mt-2 hover:bg-gray-50 transition-colors">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Click to upload an image
              </span>
              <span className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
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
