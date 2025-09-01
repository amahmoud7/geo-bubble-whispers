import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Globe, Lock, Camera, Video, Type, Loader2, Radio } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserLocation } from '@/hooks/useUserLocation';
import LiveStreamCamera from '@/components/livestream/LiveStreamCamera';
import { LiveStreamService, LiveStreamData } from '@/services/livestreamService';

interface SimplePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

type PostType = 'text' | 'media' | 'live';

const SimplePostModal: React.FC<SimplePostModalProps> = ({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [currentLiveStream, setCurrentLiveStream] = useState<LiveStreamData | null>(null);
  const [streamTitle, setStreamTitle] = useState('');
  
  const { userLocation } = useUserLocation();
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent('');
      setPostType('text');
      setIsPrivate(false);
      setMediaFile(null);
      setMediaPreview(null);
      setIsLiveStreaming(false);
      setCurrentLiveStream(null);
      setStreamTitle('');
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB for video, 5MB for image
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File must be smaller than ${file.type.startsWith('video/') ? '100MB' : '5MB'}`,
        variant: "destructive"
      });
      return;
    }
    
    setMediaFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For livestream, we don't submit - the stream is already running
    if (postType === 'live') {
      toast({
        title: "Already streaming!",
        description: "Your livestream is already active",
      });
      return;
    }
    
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
      // Simulate post creation (in a real app, this would call an API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPost = {
        id: `post-${Date.now()}`,
        content: content.trim(),
        type: postType,
        mediaUrl: mediaPreview || undefined,
        isPrivate,
        location: userLocation ? {
          lat: userLocation.lat,
          lng: userLocation.lng,
          name: 'Current Location'
        } : null,
        createdAt: new Date().toISOString(),
        user: {
          id: 'current-user',
          name: 'You',
          avatar: '/placeholder-avatar.png'
        }
      };

      onPostCreated?.(newPost);

      toast({
        title: "Lo posted!",
        description: `Your ${postType === 'text' ? 'message' : postType} Lo has been shared`,
      });

      onClose();

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Failed to post",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create Lo</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Content */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Post Type Selection - Simplified */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPostType('text')}
                className={`flex-1 flex items-center justify-center space-x-1.5 p-3 rounded-lg border transition-all ${
                  postType === 'text'
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">Text</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPostType('media')}
                className={`flex-1 flex items-center justify-center space-x-1.5 p-3 rounded-lg border transition-all ${
                  postType === 'media'
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm font-medium">Photo/Video</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPostType('live')}
                className={`flex-1 flex items-center justify-center space-x-1.5 p-3 rounded-lg border transition-all ${
                  postType === 'live'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <Radio className="h-4 w-4" />
                <span className="text-sm font-medium">Live</span>
              </button>
            </div>

            {/* Content Input - Hide for live streaming */}
            {postType !== 'live' && (
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's happening here?`}
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {content.length}/500
                </div>
              </div>
            )}

            {/* Livestream Interface */}
            {postType === 'live' && (
              <div>
                <LiveStreamCamera
                  isStreaming={isLiveStreaming}
                  onStreamStart={async (stream) => {
                    if (!userLocation) {
                      toast({
                        title: "Location required",
                        description: "Please enable location to start livestreaming",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      const liveStreamData = await LiveStreamService.startLiveStream(
                        stream,
                        streamTitle || 'Live from my location',
                        {
                          lat: userLocation.lat,
                          lng: userLocation.lng,
                          name: 'Current Location'
                        },
                        isPrivate
                      );
                      
                      setCurrentLiveStream(liveStreamData);
                      setIsLiveStreaming(true);
                      
                      // Notify parent component
                      onPostCreated?.({
                        id: liveStreamData.id,
                        content: liveStreamData.title,
                        type: 'live',
                        isLive: true,
                        streamUrl: liveStreamData.streamUrl,
                        location: liveStreamData.location,
                        createdAt: liveStreamData.startedAt
                      });
                    } catch (error: any) {
                      toast({
                        title: "Failed to start stream",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                  onStreamEnd={async () => {
                    if (currentLiveStream) {
                      try {
                        await LiveStreamService.endLiveStream(currentLiveStream.id);
                        setIsLiveStreaming(false);
                        setCurrentLiveStream(null);
                        onClose();
                      } catch (error: any) {
                        toast({
                          title: "Error ending stream",
                          description: error.message,
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  viewerCount={currentLiveStream?.viewerCount || 0}
                  streamTitle={streamTitle}
                  onTitleChange={setStreamTitle}
                />
              </div>
            )}

            {/* Media Upload */}
            {postType === 'media' && (
              <div>
                {!mediaFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Camera className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        Add photo or video
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to browse • Max 5MB (photo) / 100MB (video)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {mediaFile?.type.startsWith('image/') ? (
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
                    <button
                      type="button"
                      onClick={clearMedia}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Privacy & Location - Hide for live streaming (handled in LiveStreamCamera) */}
            {postType !== 'live' && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {userLocation ? 'Current location' : 'Location disabled'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isPrivate
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  <span>{isPrivate ? 'Private' : 'Public'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer - Different for livestream */}
          {postType === 'live' ? (
            <div className="flex justify-center p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {isLiveStreaming ? 'You are currently live streaming!' : 'Use the controls above to start your livestream'}
              </p>
            </div>
          ) : (
            <div className="flex space-x-3 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || (!content.trim() && !mediaFile)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post Lo</span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SimplePostModal;