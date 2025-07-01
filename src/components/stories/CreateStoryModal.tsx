import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import MediaUpload from '@/components/message/MediaUpload';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory: (storyData: {
    content?: string;
    media_url?: string;
    media_type?: string;
    location?: string;
  }) => Promise<boolean>;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onCreateStory,
}) => {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedFile) {
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = '';
      let mediaType = 'image';

      if (selectedFile) {
        // In a real app, you would upload the file to storage here
        // For now, we'll use the preview URL
        mediaUrl = previewUrl || '';
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      }

      const success = await onCreateStory({
        content: content.trim() || undefined,
        media_url: mediaUrl || undefined,
        media_type: mediaType,
        location: location.trim() || undefined,
      });

      if (success) {
        // Reset form
        setContent('');
        setLocation('');
        handleClearSelection();
        onClose();
      }
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    handleClearSelection();
    setContent('');
    setLocation('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Story</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Story Content</Label>
            <Textarea
              id="content"
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>

          <MediaUpload
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
            onClearSelection={handleClearSelection}
          />

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              placeholder="Where are you?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={(!content.trim() && !selectedFile) || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Posting...' : 'Post Story'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;