
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { mockMessages } from '@/mock/messages';
import MediaUpload from './MediaUpload';
import PrivacyToggle from './PrivacyToggle';
import LocationInfo from './LocationInfo';

interface CreateMessageFormProps {
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
}

const CreateMessageForm: React.FC<CreateMessageFormProps> = ({ onClose, initialPosition }) => {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isPinPlaced, setIsPinPlaced] = useState(false);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      setIsPinPlaced(true);
    }
  }, [initialPosition]);

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
          <LocationInfo isPinPlaced={isPinPlaced} />
          
          <div className="space-y-1">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="What's happening here?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
              rows={4}
              required
            />
          </div>
          
          <MediaUpload
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
            onClearSelection={clearFileSelection}
          />
          
          <PrivacyToggle isPublic={isPublic} onToggle={setIsPublic} />
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className={`w-full transition-opacity ${!content.trim() ? 'opacity-50' : 'opacity-100'}`}
            disabled={isSubmitDisabled}
          >
            {isLoading ? "Dropping Lo..." : "Drop Lo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateMessageForm;
