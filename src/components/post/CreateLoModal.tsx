import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Camera, Type, Radio, Paperclip, UploadCloud, ShieldCheck, Navigation, Image as ImageIcon, Smile, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserLocation } from '@/hooks/useUserLocation';
import LiveStreamCamera from '@/components/livestream/LiveStreamCamera';
import { LiveStreamService, LiveStreamData } from '@/services/livestreamService';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '@/contexts/EnhancedMapContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';

interface CreateLoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

type PostType = 'text' | 'media' | 'live';

const POST_TYPE_OPTIONS: { type: PostType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'text', label: 'Text', description: 'Share a quick update', icon: Type },
  { type: 'media', label: 'Media', description: 'Photo or video moment', icon: Camera },
  { type: 'live', label: 'Live', description: 'Broadcast in real-time', icon: Radio },
];

const CreateLoModal: React.FC<CreateLoModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [currentLiveStream, setCurrentLiveStream] = useState<LiveStreamData | null>(null);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { userLocation } = useUserLocation();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const { isLoaded, loadError } = useGoogleMapsLoader();

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
      setSelectedLocation(null);
      setLocationName('');
      setIsLocationExpanded(false);
    }
  }, [isOpen]);

  // Auto-set user location
  useEffect(() => {
    if (userLocation && !selectedLocation) {
      setSelectedLocation(userLocation);
      // Reverse geocode to get location name
      if (window.google && isLoaded) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: userLocation }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setLocationName(results[0].formatted_address.split(',')[0]);
          }
        });
      }
    }
  }, [userLocation, selectedLocation, isLoaded]);

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
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File must be smaller than ${file.type.startsWith('video/') ? '100MB' : '5MB'}`,
        variant: "destructive"
      });
      return;
    }
    
    setMediaFile(file);
    
    // Convert to base64 for persistent storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setMediaPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setSelectedLocation(newLocation);
      
      // Reverse geocode to get location name
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newLocation }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setLocationName(results[0].formatted_address.split(',')[0]);
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (postType === 'live') {
      if (!isLiveStreaming || !currentLiveStream) {
        toast({ title: 'Start streaming', description: 'Go live before publishing.' });
        return;
      }
      // Livestream metadata handled elsewhere
      return;
    }

    if (!content.trim() && !mediaFile) {
      toast({
        title: 'Add something to share',
        description: 'Write a message or attach media.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        title: 'Location required',
        description: 'Select a spot so others can discover your Lo.',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);

    try {
      onPostCreated?.({
        id: `post-${Date.now()}`,
        content: content.trim(),
        type: postType,
        mediaUrl: mediaPreview || undefined,
        isPrivate,
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          name: locationName || 'Selected Location',
        },
        createdAt: new Date().toISOString(),
      });

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Failed to post', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const locationDisplay = selectedLocation ? (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
      <div className="flex items-center gap-2 font-medium text-slate-700">
        <MapPin className="h-4 w-4 text-slate-500" />
        {locationName || 'Selected Location'}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
      </p>
    </div>
  ) : null;

  const mapSection = isLoaded ? (
    <div className={isLocationExpanded ? 'h-56' : 'h-40'}>
      <GoogleMap
        mapContainerClassName="h-full w-full rounded-2xl"
        center={selectedLocation || userLocation || { lat: 40.7128, lng: -74.006 }}
        zoom={15}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#0f172a',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </div>
  ) : (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
      {loadError ? 'Map unavailable right now' : 'Loading map…'}
    </div>
  );

  const composerFooterDisabled =
    isPublishing || (postType !== 'live' && !content.trim() && !mediaFile);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent side="bottom" className="h-[88vh] overflow-y-auto rounded-t-[32px] bg-lo-midnight border-lo-gray-800 px-6 pb-6 pt-4">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <SheetTitle className="text-lg font-semibold text-white">
            New Lo
          </SheetTitle>
          <button
            onClick={handleSubmit}
            disabled={composerFooterDisabled}
            className="text-lo-electric-blue font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </SheetHeader>

        <div className="mt-4 space-y-6">

          {postType === 'live' ? (
            <LiveStreamCamera
              isStreaming={isLiveStreaming}
              streamTitle={streamTitle}
              onTitleChange={setStreamTitle}
              onStreamStart={async (stream, { title }) => {
                if (!selectedLocation) {
                  toast({ title: 'Location required', description: 'Select a location first', variant: 'destructive' });
                  return;
                }
                try {
                  const resolvedTitle = title.trim() || streamTitle.trim() || 'Live on Lo';
                  const liveStreamData = await LiveStreamService.startLiveStream(
                    stream,
                    resolvedTitle,
                    {
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      name: locationName || 'Selected Location',
                    },
                    isPrivate
                  );
                  setStreamTitle(resolvedTitle);
                  setCurrentLiveStream(liveStreamData);
                  setIsLiveStreaming(true);
                } catch (error: unknown) {
                  setIsLiveStreaming(false);
                  setCurrentLiveStream(null);
                  const message = error instanceof Error ? error.message : 'Please try again in a moment.';
                  throw new Error(message);
                }
              }}
              onStreamEnd={async () => {
                if (!currentLiveStream) {
                  return;
                }

                try {
                  await LiveStreamService.endLiveStream(currentLiveStream.id);
                  setCurrentLiveStream(null);
                  setIsLiveStreaming(false);
                  onClose();
                } catch (error) {
                  setIsLiveStreaming(true);
                  throw error instanceof Error ? error : new Error('Unable to end livestream.');
                }
              }}
            />
          ) : (
            <div className="space-y-4">
              <div>
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={280}
                  className="min-h-[140px] resize-none rounded-2xl border-0 bg-lo-gray-800 text-base text-white placeholder:text-lo-gray-400 focus:ring-2 focus:ring-lo-electric-blue/50 p-4"
                />
                <p className="mt-2 text-right text-xs text-lo-gray-400">{content.length}/280</p>
              </div>

              {mediaFile && (
                <div className="relative rounded-2xl overflow-hidden">
                  {mediaFile.type.startsWith('image/') ? (
                    <img src={mediaPreview ?? ''} alt="Preview" className="w-32 h-32 rounded-2xl object-cover" />
                  ) : (
                    <video src={mediaPreview ?? ''} className="w-32 h-32 rounded-2xl object-cover" />
                  )}
                  <button
                    onClick={clearMedia}
                    className="absolute -top-2 -right-2 bg-lo-gray-600 rounded-full p-1.5 hover:bg-lo-gray-500 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 py-4 px-5 bg-lo-gray-800 hover:bg-lo-gray-800/70 rounded-2xl text-white transition-colors"
                >
                  <div className="bg-lo-electric-blue/20 p-3 rounded-xl">
                    <ImageIcon className="h-5 w-5 text-lo-electric-blue" />
                  </div>
                  <span className="font-medium">Photo/Video</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsLocationExpanded(true)}
                  className="w-full flex items-center gap-4 py-4 px-5 bg-lo-gray-800 hover:bg-lo-gray-800/70 rounded-2xl text-white transition-colors"
                >
                  <div className="bg-lo-electric-blue/20 p-3 rounded-xl">
                    <MapPin className="h-5 w-5 text-lo-electric-blue" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">Location</span>
                    {locationName && (
                      <p className="text-xs text-lo-gray-400 mt-0.5">{locationName}</p>
                    )}
                  </div>
                </button>
                
                <button
                  type="button"
                  className="w-full flex items-center gap-4 py-4 px-5 bg-lo-gray-800 hover:bg-lo-gray-800/70 rounded-2xl text-white transition-colors"
                >
                  <div className="bg-lo-electric-blue/20 p-3 rounded-xl">
                    <Smile className="h-5 w-5 text-lo-electric-blue" />
                  </div>
                  <span className="font-medium">Mood</span>
                </button>
              </div>
            </div>
          )}

          {isLocationExpanded && (
            <div className="space-y-3 rounded-2xl bg-lo-gray-800 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Choose Location</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsLocationExpanded(false)}
                  className="text-lo-gray-400 hover:text-white"
                >
                  Done
                </Button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-lo-gray-600">
                {mapSection}
              </div>
              {locationDisplay && (
                <div className="text-sm text-lo-gray-300">{locationName}</div>
              )}
            </div>
          )}
          
          {/* Public Toggle */}
          <div className="flex items-center justify-between py-4 px-5 bg-lo-gray-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-lo-electric-blue/20 p-2.5 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-lo-electric-blue" />
              </div>
              <span className="font-medium text-white">Public</span>
            </div>
            <Switch checked={!isPrivate} onCheckedChange={(checked) => setIsPrivate(!checked)} />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            className="h-14 w-full rounded-full bg-lo-electric-blue text-white hover:bg-lo-electric-blue/90 font-semibold text-base shadow-xl"
            disabled={composerFooterDisabled}
            onClick={handleSubmit}
          >
            {isPublishing ? 'Publishing…' : postType === 'live' ? 'Go Live' : 'Post Lo'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateLoModal;
