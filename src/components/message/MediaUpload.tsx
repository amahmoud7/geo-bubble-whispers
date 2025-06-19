
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import LiveStreamRecorder from './LiveStreamRecorder';
import MediaPreview from './MediaPreview';
import FileUploadArea from './FileUploadArea';
import { validateVideo, validateFileSize } from './utils/videoValidation';
import { createSyntheticFileEvent } from './utils/liveStreamHandler';

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

  const handleLiveStreamVideo = (videoFile: File) => {
    createSyntheticFileEvent(videoFile, onFileChange);
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
        <MediaPreview
          previewUrl={previewUrl}
          isVideo={!!isVideo}
          onClearSelection={onClearSelection}
        />
      ) : (
        <FileUploadArea
          isValidating={isValidating}
          onFileChange={handleFileChange}
          onShowLiveStream={() => setShowLiveStream(true)}
        />
      )}
    </div>
  );
};

export default MediaUpload;
