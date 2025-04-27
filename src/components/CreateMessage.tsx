
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MapPin, Image, X, Move } from 'lucide-react';
import { mockMessages } from '@/mock/messages';

interface CreateMessageProps {
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
}

const CreateMessage: React.FC<CreateMessageProps> = ({ onClose, initialPosition }) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                {isPinPlaced ? (
                  <span>Pin placed! Move it to adjust location</span>
                ) : (
                  <span>Place your pin on the map</span>
                )}
              </div>
              {isPinPlaced && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Move className="h-4 w-4" />
                  Move Pin
                </Button>
              )}
            </div>
            
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
                    onClick={clearFileSelection}
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
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="public-toggle">Make public</Label>
                <div className="text-xs text-muted-foreground">
                  {isPublic ? 'Anyone can see this message' : 'Only followers can see this message'}
                </div>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
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
    </div>
  );
};

export default CreateMessage;
