
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { X, Loader, Image as ImageIcon, TextCursor } from 'lucide-react';
import { mockMessages } from '@/mock/messages';
import MediaUpload from './MediaUpload';
import PrivacyToggle from './PrivacyToggle';
import LocationPicker from './LocationPicker';

interface CreateMessageFormProps {
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
  onManualPinPlacement?: () => void;
}

const MAX_CONTENT_LENGTH = 500;

const CreateMessageForm: React.FC<CreateMessageFormProps> = ({ 
  onClose, 
  initialPosition,
  onManualPinPlacement
}) => {
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isPinPlaced, setIsPinPlaced] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [remainingChars, setRemainingChars] = useState(MAX_CONTENT_LENGTH);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      setIsPinPlaced(true);
    }
  }, [initialPosition]);

  useEffect(() => {
    setRemainingChars(MAX_CONTENT_LENGTH - content.length);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CONTENT_LENGTH) {
      setContent(newContent);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
  };

  const handleLocationChange = (newPosition: { lat: number; lng: number }) => {
    setPosition(newPosition);
    setIsPinPlaced(true);
  };

  const handleManualPlacement = () => {
    if (onManualPinPlacement) {
      setIsManualMode(true);
      onManualPinPlacement();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position || !isPinPlaced) {
      toast({
        title: "Location required",
        description: "Please place and confirm the pin location for your Lo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Create a new message object
    const newMessage = {
      id: `new-${Date.now()}`,
      content: content,
      location: "Current Location",
      user: {
        name: "Current User",
        avatar: "/placeholder.svg"
      },
      isPublic: isPublic,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      mediaUrl: previewUrl || undefined,
      caption: caption || undefined,
      position: {
        x: position.lat,
        y: position.lng
      }
    };
    
    // Add the new message to mockMessages
    mockMessages.unshift(newMessage);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Lo dropped!",
        description: "Your Lo has been posted successfully!",
      });
      onClose();
    }, 1000);
  };

  const isSubmitDisabled = isLoading || !content.trim() || !isPinPlaced;

  return (
    <Card className="w-full max-w-md mx-auto bg-white fade-in">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Drop a Lo</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Location Picker */}
          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <LocationPicker 
              initialPosition={position}
              onLocationChange={handleLocationChange}
              isPinPlaced={isPinPlaced}
              onManualPlacement={handleManualPlacement}
            />
          </div>
          
          {/* Message Content */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label htmlFor="message">Message</Label>
              <div className={`text-xs ${remainingChars < 50 ? 'text-amber-500' : remainingChars < 20 ? 'text-red-500' : 'text-muted-foreground'}`}>
                <TextCursor className="h-3 w-3 inline mr-1" />
                {remainingChars} characters left
              </div>
            </div>
            <Textarea
              id="message"
              placeholder="What's happening here?"
              value={content}
              onChange={handleContentChange}
              className="resize-none"
              rows={4}
              required
            />
          </div>
          
          {/* Media Upload */}
          <MediaUpload
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
            onClearSelection={clearFileSelection}
          />
          
          {/* Image Caption (only shown when image is selected) */}
          {previewUrl && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="caption">Image Caption (optional)</Label>
                <div className="text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3 inline mr-1" />
                  Add context to your image
                </div>
              </div>
              <Textarea
                id="caption"
                placeholder="Add a caption to your image..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          )}
          
          {/* Privacy Toggle */}
          <PrivacyToggle isPublic={isPublic} onToggle={setIsPublic} />
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className={`w-full transition-opacity ${!content.trim() ? 'opacity-50' : 'opacity-100'}`}
            disabled={isSubmitDisabled}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Dropping Lo...
              </span>
            ) : "Drop Lo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateMessageForm;
