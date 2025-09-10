import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Globe, Lock, Camera, Video, Type, Loader2, Radio, ChevronRight, CheckCircle, Navigation } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserLocation } from '@/hooks/useUserLocation';
import LiveStreamCamera from '@/components/livestream/LiveStreamCamera';
import { LiveStreamService, LiveStreamData } from '@/services/livestreamService';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';

interface CreateLoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

type PostType = 'text' | 'media' | 'live';
type CreateStep = 'type' | 'location' | 'content';

const CreateLoModal: React.FC<CreateLoModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<CreateStep>('type');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [currentLiveStream, setCurrentLiveStream] = useState<LiveStreamData | null>(null);
  const [streamTitle, setStreamTitle] = useState('');
  
  // Location state
  const { userLocation } = useUserLocation();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: ['places']
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('type');
      setContent('');
      setPostType(null);
      setIsPrivate(false);
      setMediaFile(null);
      setMediaPreview(null);
      setIsLiveStreaming(false);
      setCurrentLiveStream(null);
      setStreamTitle('');
      setSelectedLocation(null);
      setLocationName('');
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

  const handleTypeSelect = (type: PostType) => {
    setPostType(type);
    setCurrentStep('location');
  };

  const handleLocationConfirm = () => {
    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a location for your Lo",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('content');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a location for your Lo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const newPost = {
        id: `post-${Date.now()}`,
        content: content.trim(),
        type: postType,
        mediaUrl: mediaPreview || undefined,
        isPrivate,
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          name: locationName || 'Selected Location'
        },
        createdAt: new Date().toISOString(),
        user: {
          id: 'current-user',
          name: 'You',
          avatar: '/placeholder-avatar.png'
        }
      };

      onPostCreated?.(newPost);

      // Success toast is now handled by the parent component after database save
      // onClose() is also handled by the parent component

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
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {['type', 'location', 'content'].map((step, index) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
            currentStep === step 
              ? 'bg-lo-teal text-white' 
              : index < ['type', 'location', 'content'].indexOf(currentStep)
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {index < ['type', 'location', 'content'].indexOf(currentStep) ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-semibold">{index + 1}</span>
            )}
          </div>
          {index < 2 && (
            <div className={`w-12 h-0.5 transition-all ${
              index < ['type', 'location', 'content'].indexOf(currentStep)
                ? 'bg-green-500'
                : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
        What would you like to share?
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => handleTypeSelect('text')}
          className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-lo-teal hover:bg-lo-teal/5 transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Type className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Text Message</p>
              <p className="text-sm text-gray-500">Share your thoughts</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-lo-teal transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => handleTypeSelect('media')}
          className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-lo-teal hover:bg-lo-teal/5 transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Photo/Video</p>
              <p className="text-sm text-gray-500">Share visual moments</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-lo-teal transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => handleTypeSelect('live')}
          className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Go Live</p>
              <p className="text-sm text-gray-500">Stream from your location</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </div>
  );

  const renderLocationSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentStep('type')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          Select Location
        </h3>
        <div className="w-9" />
      </div>

      <div className="space-y-4">
        {/* Current Location Button */}
        <button
          type="button"
          onClick={() => {
            if (userLocation) {
              setSelectedLocation(userLocation);
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: userLocation }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                  setLocationName(results[0].formatted_address.split(',')[0]);
                }
              });
            }
          }}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-lo-teal/10 border border-lo-teal/30 hover:bg-lo-teal/20 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-lo-teal" />
            <span className="font-medium text-gray-900">Use Current Location</span>
          </div>
          {selectedLocation && selectedLocation.lat === userLocation?.lat && (
            <CheckCircle className="w-5 h-5 text-lo-teal" />
          )}
        </button>

        {/* Map for location selection */}
        {isLoaded && (
          <div className="relative">
            <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
              <GoogleMap
                mapContainerClassName="w-full h-full"
                center={selectedLocation || userLocation || { lat: 40.7128, lng: -74.0060 }}
                zoom={15}
                onClick={handleMapClick}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  clickableIcons: false,
                  styles: [
                    {
                      featureType: "poi",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }]
                    }
                  ]
                }}
              >
                {selectedLocation && (
                  <Marker
                    position={selectedLocation}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#13D3AA',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2
                    }}
                  />
                )}
              </GoogleMap>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tap on the map to select a different location
            </p>
          </div>
        )}

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <MapPin className="w-5 h-5 text-lo-teal mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {locationName || 'Selected Location'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleLocationConfirm}
          disabled={!selectedLocation}
          className="w-full bg-gradient-to-r from-lo-teal to-emerald-500 hover:from-emerald-600 hover:to-lo-teal text-white"
        >
          Continue to Create Lo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'type':
        return renderTypeSelection();
      case 'location':
        return renderLocationSelection();
      case 'content':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentStep('location')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                Create Your Lo
              </h3>
              <div className="w-9" />
            </div>

            {/* Location Badge */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-lo-teal/10 rounded-full">
                <MapPin className="w-4 h-4 text-lo-teal" />
                <span className="text-sm font-medium text-gray-700">
                  {locationName || 'Selected Location'}
                </span>
              </div>
            </div>

            {/* Content based on type */}
            {postType === 'live' ? (
              <LiveStreamCamera
                isStreaming={isLiveStreaming}
                onStreamStart={async (stream) => {
                  if (!selectedLocation) {
                    toast({
                      title: "Location required",
                      description: "Please select a location first",
                      variant: "destructive"
                    });
                    return;
                  }

                  try {
                    const liveStreamData = await LiveStreamService.startLiveStream(
                      stream,
                      streamTitle || 'Live from my location',
                      {
                        lat: selectedLocation.lat,
                        lng: selectedLocation.lng,
                        name: locationName || 'Selected Location'
                      },
                      isPrivate
                    );
                    
                    setCurrentLiveStream(liveStreamData);
                    setIsLiveStreaming(true);
                    
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
            ) : (
              <>
                {postType !== 'media' && (
                  <div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's happening at this location?"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-lo-teal focus:border-transparent"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {content.length}/500
                    </div>
                  </div>
                )}

                {postType === 'media' && (
                  <div>
                    {!mediaFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-lo-teal hover:bg-gray-50 transition-all"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-3 bg-gray-100 rounded-full">
                            <Camera className="h-6 w-6 text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            Add photo or video
                          </p>
                          <p className="text-xs text-gray-500">
                            Max 5MB (photo) / 100MB (video)
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

                    {mediaFile && (
                      <div className="mt-3">
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Add a caption..."
                          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-lo-teal focus:border-transparent"
                          rows={2}
                          maxLength={500}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {isPrivate ? <Lock className="h-4 w-4 text-orange-500" /> : <Globe className="h-4 w-4 text-lo-teal" />}
                    <span className="text-sm text-gray-700">
                      {isPrivate ? 'Private (Followers only)' : 'Public (Everyone)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPrivate ? 'bg-orange-500' : 'bg-lo-teal'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Liquid Glass Backdrop */}
      <div 
        className="absolute inset-0 glass-overlay"
        onClick={onClose}
      />
      
      {/* Modal with Liquid Glass UI */}
      <div className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in"
           style={{
             background: 'rgba(255, 255, 255, 0.15)',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(255, 255, 255, 0.3)',
             boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 glass border-b border-white/20">
          <h2 className="text-lg font-semibold text-white liquid-text">Create Lo</h2>
          <button
            onClick={onClose}
            className="p-1.5 glass hover:bg-white/20 rounded-full transition-all"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {renderStepIndicator()}
            {renderContent()}
          </div>

          {/* Footer - Only show for non-live posts in content step */}
          {currentStep === 'content' && postType !== 'live' && (
            <div className="flex space-x-3 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentStep('location')}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || (!content.trim() && !mediaFile)}
                className="flex-1 liquid-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

export default CreateLoModal;