import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Image, 
  Video, 
  Type, 
  Radio, 
  Globe, 
  Lock, 
  X,
  Plus,
  Loader2,
  Hash,
  AtSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserLocation } from '@/hooks/useUserLocation';
import { MediaUploadService } from '@/utils/mediaUpload';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

type PostType = 'text' | 'image' | 'video' | 'live';

const PostCreationModal: React.FC<PostCreationModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  
  const { userLocation, getCurrentLocation } = useUserLocation();
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      MediaUploadService.validateFile(file, [postType === 'image' ? 'image' : 'video']);
      setMediaFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    } catch (error: any) {
      toast({
        title: "Invalid file",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [postType]);

  const extractHashtagsAndMentions = useCallback((text: string) => {
    const hashtagMatches = text.match(/#[\w]+/g) || [];
    const mentionMatches = text.match(/@[\w]+/g) || [];
    
    setHashtags(hashtagMatches.map(tag => tag.substring(1)));
    setMentions(mentionMatches.map(mention => mention.substring(1)));
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    extractHashtagsAndMentions(text);
  }, [extractHashtagsAndMentions]);

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast({
        title: "Content required",
        description: "Please add some content to your Lo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let mediaUrl: string | undefined;
      
      // Upload media if present
      if (mediaFile) {
        const uploadResult = await MediaUploadService.uploadFile(mediaFile);
        mediaUrl = uploadResult.url;
      }

      // Get current location
      let location = userLocation;
      if (!location) {
        location = await getCurrentLocation();
      }

      // Create new post object
      const newPost = {
        id: `post-${Date.now()}`,
        content: content.trim(),
        type: postType,
        mediaUrl,
        isPrivate,
        location: location ? {
          lat: location.lat,
          lng: location.lng,
          name: 'Current Location'
        } : null,
        hashtags,
        mentions,
        createdAt: new Date().toISOString(),
        user: {
          id: 'current-user',
          name: 'You',
          avatar: '/placeholder-avatar.png'
        },
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      // Call the callback to add post to the feed
      onPostCreated?.(newPost);

      toast({
        title: "Lo posted!",
        description: `Your ${postType === 'text' ? 'message' : postType} Lo has been shared`,
      });

      // Reset form and close modal
      setContent('');
      setPostType('text');
      setIsPrivate(false);
      setMediaFile(null);
      setMediaPreview(null);
      setHashtags([]);
      setMentions([]);
      onClose();

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Failed to post",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const postTypes = [
    { type: 'text' as PostType, icon: Type, label: 'Text', description: 'Share your thoughts' },
    { type: 'image' as PostType, icon: Image, label: 'Photo', description: 'Share a moment' },
    { type: 'video' as PostType, icon: Video, label: 'Video', description: 'Share a story' },
    { type: 'live' as PostType, icon: Radio, label: 'Live', description: 'Go live now' }
  ];

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">Create Lo</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Type Selection */}
          <div className="grid grid-cols-2 gap-2">
            {postTypes.map((type) => (
              <Button
                key={type.type}
                variant={postType === type.type ? "default" : "outline"}
                className={cn(
                  "h-auto p-3 flex-col space-y-1",
                  postType === type.type && "bg-lo-teal hover:bg-lo-teal/90"
                )}
                onClick={() => setPostType(type.type)}
              >
                <type.icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="text-xs font-medium">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Textarea
              placeholder={`What's happening here? ${postType === 'live' ? 'Describe your live stream...' : ''}`}
              value={content}
              onChange={handleContentChange}
              className="min-h-[120px] text-base resize-none border-gray-200 focus:border-lo-teal"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <div className="flex space-x-2">
                {hashtags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span>{hashtags.length} hashtag{hashtags.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {mentions.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AtSign className="h-3 w-3" />
                    <span>{mentions.length} mention{mentions.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <span>{content.length}/500</span>
            </div>
          </div>

          {/* Media Upload for Image/Video */}
          {(postType === 'image' || postType === 'video') && (
            <div className="space-y-2">
              {!mediaFile ? (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Click to add {postType === 'image' ? 'photo' : 'video'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept={postType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  {postType === 'image' ? (
                    <img
                      src={mediaPreview!}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={mediaPreview!}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={clearMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Location */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {userLocation ? 'Current location' : 'Location disabled'}
              </span>
            </div>
            <Button
              variant={isPrivate ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPrivate(!isPrivate)}
              className={cn(
                "flex items-center space-x-1",
                isPrivate ? "bg-orange-500 hover:bg-orange-600" : ""
              )}
            >
              {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              <span className="text-xs">{isPrivate ? 'Private' : 'Public'}</span>
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && !mediaFile)}
              className="flex-1 bg-lo-teal hover:bg-lo-teal/90"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Posting...</span>
                </span>
              ) : (
                `Post Lo`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostCreationModal;