
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { X, Loader, Type, Image, Video, Radio, MapPin, Hash, AtSign, Clock, Settings, Save } from 'lucide-react';
import { mockMessages } from '@/mock/messages';
import MediaUpload from './MediaUpload';
import PrivacyToggle from './PrivacyToggle';
import LocationInfo from './LocationInfo';
import ModernMediaUpload from './ModernMediaUpload';
import ModernLocationSelector from './ModernLocationSelector';
import LiveStreamInterface from './LiveStreamInterface';
import RichTextEditor from './RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { eventBus } from '@/utils/eventBus';
import type { MapMessage } from '@/types/messages';

interface CreateMessageFormProps {
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
  addMessage: (newMessage: MapMessage) => void;
  updateMessage: (id: string, updates: Partial<MapMessage>) => void;
}

const CreateMessageForm: React.FC<CreateMessageFormProps> = ({ onClose, initialPosition, addMessage, updateMessage }) => {
  const { user } = useAuth();
  // Core state
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isPinPlaced, setIsPinPlaced] = useState(false);
  
  // Modern UI state
  const [activeTab, setActiveTab] = useState('text');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [locationName, setLocationName] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const saveDraft = () => {
    if (content.trim()) {
      const draftData = {
        content,
        activeTab,
        mediaFiles,
        locationName,
        hashtags,
        mentions,
        isPublic,
        position,
        timestamp: Date.now()
      };
      localStorage.setItem('lo_draft', JSON.stringify(draftData));
      setIsDraft(true);
      toast({
        title: "Draft saved",
        description: "Your Lo has been saved as a draft",
      });
    }
  };

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('lo_draft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setContent(draftData.content || '');
        setActiveTab(draftData.activeTab || 'text');
        setMediaFiles(draftData.mediaFiles || []);
        setLocationName(draftData.locationName || '');
        setHashtags(draftData.hashtags || []);
        setMentions(draftData.mentions || []);
        setIsPublic(draftData.isPublic ?? true);
        if (draftData.position) {
          setPosition(draftData.position);
          setIsPinPlaced(true);
        }
        toast({
          title: "Draft loaded",
          description: "Your saved draft has been loaded",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
        toast({
          title: "Error loading draft",
          description: "Failed to load your saved draft",
          variant: "destructive"
        });
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('lo_draft');
    setIsDraft(false);
  };

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('lo_draft');
    if (savedDraft && !content) {
      setIsDraft(true);
    }
  }, [content]);

  // Update character count when content changes
  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position || !isPinPlaced) {
      toast({
        title: "Location required",
        description: "Please place and confirm the pin location for your Lo",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a Lo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Determine post type and media URL
      const mediaUrl = previewUrl;
      let postType = 'text';
      
      if (mediaFiles.length > 0) {
        // For multiple files, create a carousel
        postType = mediaFiles[0].type.startsWith('video/') ? 'video' : 'image';
        // TODO: Handle multiple file uploads
      } else if (selectedFile) {
        postType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      }
      
      if (activeTab === 'live') {
        postType = 'livestream';
      }
      
      // First, save the message to the database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          content: content,
          location: locationName || "Current Location",
          user_id: user.id,
          is_public: isPublic,
          lat: position.lat,
          lng: position.lng,
          media_url: mediaUrl || null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('*, profiles:user_id(name, username, avatar_url)')
        .single();

      if (messageError) {
        console.error('❌ Database error:', messageError);
        throw messageError;
      }

      const derivedLat = messageData.lat ?? position.lat;
      const derivedLng = messageData.lng ?? position.lng;

      const newMessage: MapMessage = {
        id: `new-${messageData.id}`,
        content: messageData.content ?? '',
        location: messageData.location ?? 'Current Location',
        user: {
          name: messageData.profiles?.name || user.user_metadata?.full_name || 'Current User',
          avatar: messageData.profiles?.avatar_url || user.user_metadata?.avatar_url || '/placeholder.svg',
        },
        isPublic: Boolean(messageData.is_public),
        timestamp: messageData.created_at,
        expiresAt: messageData.expires_at ?? null,
        mediaUrl: messageData.media_url ?? null,
        position: {
          lat: derivedLat,
          lng: derivedLng,
          x: derivedLat,
          y: derivedLng,
        },
        lat: derivedLat,
        lng: derivedLng,
        liked: false,
        likes: 0,
        isEvent: false,
      };

      addMessage(newMessage);
      eventBus.emit('messageCreated', { id: messageData.id });

      // Clear draft if it exists
      clearDraft();
      
      // Stop the bounce animation after 2 seconds by removing the 'new-' prefix
      setTimeout(() => {
        updateMessage(newMessage.id, {
          id: messageData.id
        });
      }, 2000);
      
      // Trigger a refresh of messages to ensure they show on the map
      // The real-time subscription should handle this, but we'll force it for reliability
      setTimeout(() => {
        eventBus.emit('refreshMessages', undefined);
      }, 100);
      
      const getSuccessMessage = () => {
        if (postType === 'livestream') return 'Your live stream Lo is now active!';
        if (mediaFiles.length > 1) return `Your Lo with ${mediaFiles.length} media files has been posted!`;
        if (postType === 'video') return 'Your video Lo has been posted!';
        if (postType === 'image') return 'Your photo Lo has been posted!';
        return 'Your Lo is live on the map!';
      };
      
      toast({
        title: "Lo posted!",
        description: getSuccessMessage(),
      });
      onClose();
      
    } catch (error: unknown) {
      console.error('Error posting message:', error);
      toast({
        title: "Error posting Lo",
        description: error instanceof Error ? error.message : "Failed to post your Lo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || !content.trim() || !isPinPlaced;

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white fade-in">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Create Lo</span>
            <div className="flex items-center space-x-2">
              {isDraft && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Draft
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="photo" className="gap-2">
                <Image className="h-4 w-4" />
                Photo
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-2">
                <Radio className="h-4 w-4" />
                Live
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4 mt-4">
              <RichTextEditor
                content={content}
                onContentChange={setContent}
                onHashtagsChange={setHashtags}
                onMentionsChange={setMentions}
                placeholder="What's happening here?"
                maxLength={500}
              />
            </TabsContent>
            
            <TabsContent value="photo" className="space-y-4 mt-4">
              <div className="space-y-4">
                <RichTextEditor
                  content={content}
                  onContentChange={setContent}
                  onHashtagsChange={setHashtags}
                  onMentionsChange={setMentions}
                  placeholder="Add a caption to your photo..."
                  maxLength={300}
                  showFormatting={false}
                />
                <ModernMediaUpload
                  files={mediaFiles}
                  onFilesChange={setMediaFiles}
                  maxFiles={10}
                  allowedTypes={['image/*']}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="video" className="space-y-4 mt-4">
              <div className="space-y-4">
                <RichTextEditor
                  content={content}
                  onContentChange={setContent}
                  onHashtagsChange={setHashtags}
                  onMentionsChange={setMentions}
                  placeholder="Describe your video..."
                  maxLength={300}
                  showFormatting={false}
                />
                <ModernMediaUpload
                  files={mediaFiles}
                  onFilesChange={setMediaFiles}
                  maxFiles={5}
                  allowedTypes={['video/*']}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="live" className="space-y-4 mt-4">
              <LiveStreamInterface
                onStreamStart={(streamData) => {
                  // Handle live stream start
                  console.log('Stream started:', streamData);
                }}
                onStreamEnd={() => {
                  // Handle live stream end
                  console.log('Stream ended');
                }}
                isStreaming={false}
              />
            </TabsContent>
          </Tabs>
          
          {/* Location Section - Always visible */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {showAdvanced ? (
              <ModernLocationSelector
                position={position}
                onPositionChange={setPosition}
                isPinPlaced={isPinPlaced}
                locationName={locationName}
                onLocationNameChange={setLocationName}
                isPrivate={!isPublic}
                onPrivacyChange={(isPrivate) => setIsPublic(!isPrivate)}
              />
            ) : (
              <LocationInfo isPinPlaced={isPinPlaced} />
            )}
          </div>
          
          {/* Privacy Toggle - Simplified */}
          {!showAdvanced && (
            <PrivacyToggle isPublic={isPublic} onToggle={setIsPublic} />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button 
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={!content.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className={`transition-opacity ${!content.trim() || !isPinPlaced ? 'opacity-50' : 'opacity-100'}`}
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </span>
              ) : "Post Lo"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateMessageForm;
