
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MapPin, Image, X } from 'lucide-react';

interface CreateMessageProps {
  onClose: () => void;
}

const CreateMessage: React.FC<CreateMessageProps> = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
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
    setIsLoading(true);
    
    // Here we'd normally submit to an API
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Message created",
        description: "Your message has been posted successfully!",
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto bg-white fade-in">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Create Message</span>
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
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Using your current location</span>
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
            <Button type="submit" className="w-full" disabled={isLoading || !content}>
              {isLoading ? "Posting..." : "Post Message"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateMessage;
