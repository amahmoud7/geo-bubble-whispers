
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video } from 'lucide-react';

interface FileUploadAreaProps {
  isValidating: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowLiveStream: () => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  isValidating,
  onFileChange,
  onShowLiveStream,
}) => {
  return (
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
            onChange={onFileChange}
            className="hidden"
            disabled={isValidating}
          />
        </label>
      </div>
      
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={onShowLiveStream}
          variant="outline"
          className="w-full"
          disabled={isValidating}
        >
          <Video className="h-4 w-4 mr-2" />
          Live
        </Button>
      </div>
    </div>
  );
};

export default FileUploadArea;
