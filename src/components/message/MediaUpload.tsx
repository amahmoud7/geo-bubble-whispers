
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image, X, Play, Live } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LiveStreamRecorder from './LiveStreamRecorder';

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
  const [isValidating, setIsValidating] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        
        if (duration > 10) {
          toast({
            title: "Video too long",
            description: "Videos must be 10 seconds or shorter for Lo posts",
            variant: "destructive"
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        toast({
          title: "Invalid video",
          description: "Please select a valid video file",
          variant: "destructive"
        });
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }
      
      // If it's a video, validate duration
      if (file.type.startsWith('video/')) {
        setIsValidating(true);
        const isValid = await validateVideo(file);
        setIsValidating(false);
        
        if (!isValid) {
          e.target.value = '';
          return;
        }
      }
      
      onFileChange(e);
    }
  };

  const handleLiveStreamVideo = (videoFile: File) => {
    // Create a synthetic event to match the expected interface
    const syntheticEvent = {
      target: {
        files: [videoFile],
        value: ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onFileChange(syntheticEvent);
    setShowLiveStream(false);
  };

  const isVideo = selectedFile?.type.startsWith('video/');

  if (showLiveStream) {
    return (
      <div className="space-y-1">
        <Label>Live Stream</Label>
        <LiveStreamRecorder
          onVideoRecorded={handleLiveStreamVideo}
          onClose={() => setShowLiveStream(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="media">Media (optional)</Label>
      
      {previewUrl ? (
        <div className="relative mt-2 h-48 w-full rounded-md overflow-hidden bg-gray-100">
          {isVideo ? (
            <div className="relative h-full w-full">
              <video
                src={previewUrl}
                className="h-full w-full object-cover"
                controls
                muted
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Video
              </div>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Selected media"
              className="h-full w-full object-cover"
            />
          )}
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
        <div className="space-y-2 mt-2">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                {isValidating ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-sm">Validating video...</span>
                  </div>
                ) : (
                  <>
                    <Image className="h-6 w-6 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium">
                      Click to upload an image or video
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Videos must be 10 seconds or shorter
                    </span>
                  </>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isValidating}
              />
            </label>
          </div>
          
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => setShowLiveStream(true)}
              variant="outline"
              className="w-full"
              disabled={isValidating}
            >
              <Live className="h-4 w-4 mr-2" />
              Live
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
