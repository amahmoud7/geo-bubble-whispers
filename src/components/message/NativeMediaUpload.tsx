import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Image, Video, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import NativeLiveStreamRecorder from './NativeLiveStreamRecorder';
import MediaPreview from './MediaPreview';
import FileUploadArea from './FileUploadArea';
import { validateVideo, validateFileSize } from './utils/videoValidation';

interface NativeMediaUploadProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSelection: () => void;
}

const NativeMediaUpload: React.FC<NativeMediaUploadProps> = ({
  selectedFile,
  previewUrl,
  onFileChange,
  onClearSelection,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 50MB)
      if (!validateFileSize(file)) {
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

  const handleNativeCamera = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
      });

      if (image.dataUrl) {
        // Convert data URL to blob then to file
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Create a synthetic event to match the expected interface
        const syntheticEvent = {
          target: {
            files: [file],
            value: ''
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onFileChange(syntheticEvent);
        
        toast({
          title: "Photo Captured",
          description: "Photo successfully captured using native camera.",
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions in Settings.",
        variant: "destructive"
      });
    }
  };

  const handleNativeGallery = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
      });

      if (image.dataUrl) {
        // Convert data URL to blob then to file
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `gallery_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Create a synthetic event to match the expected interface
        const syntheticEvent = {
          target: {
            files: [file],
            value: ''
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onFileChange(syntheticEvent);
        
        toast({
          title: "Photo Selected",
          description: "Photo successfully selected from gallery.",
        });
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      toast({
        title: "Gallery Error",
        description: "Could not access photo library. Please check permissions in Settings.",
        variant: "destructive"
      });
    }
  };

  const handleLiveStreamVideo = (file: File) => {
    // Create a synthetic event to match the expected interface
    const syntheticEvent = {
      target: {
        files: [file],
        value: ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onFileChange(syntheticEvent);
    setShowLiveStream(false);
  };

  if (showLiveStream) {
    return (
      <NativeLiveStreamRecorder
        onVideoRecorded={handleLiveStreamVideo}
        onClose={() => setShowLiveStream(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="media-upload" className="text-sm font-medium">
        Add Photo/Video {isValidating && <span className="text-muted-foreground">(Validating...)</span>}
      </Label>
      
      {selectedFile && previewUrl && (
        <MediaPreview
          file={selectedFile}
          previewUrl={previewUrl}
          onClearSelection={onClearSelection}
        />
      )}
      
      {!selectedFile && (
        <>
          {isNative ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-3">
                Choose how to add media:
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleNativeCamera}
                  variant="outline"
                  className="flex flex-col items-center space-y-2 h-auto py-4"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm">Take Photo</span>
                </Button>
                
                <Button
                  onClick={handleNativeGallery}
                  variant="outline"
                  className="flex flex-col items-center space-y-2 h-auto py-4"
                >
                  <Image className="w-6 h-6" />
                  <span className="text-sm">Photo Library</span>
                </Button>
              </div>
              
              <Button
                onClick={() => setShowLiveStream(true)}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Video className="w-5 h-5" />
                <span>Record Video</span>
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or upload file
                  </span>
                </div>
              </div>
              
              <FileUploadArea onFileChange={handleFileChange} />
            </div>
          ) : (
            <div className="space-y-3">
              <FileUploadArea onFileChange={handleFileChange} />
              
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowLiveStream(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Record Live Video</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NativeMediaUpload;