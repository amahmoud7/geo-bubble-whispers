
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  previewUrl: string;
  isVideo: boolean;
  onClearSelection: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  previewUrl,
  isVideo,
  onClearSelection,
}) => {
  return (
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
  );
};

export default MediaPreview;
