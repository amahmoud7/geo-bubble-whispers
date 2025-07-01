import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Video, Square, Users, MapPin } from 'lucide-react';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { useUserLocation } from '@/hooks/useUserLocation';

interface LiveStreamControllerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveStreamController: React.FC<LiveStreamControllerProps> = ({
  isOpen,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchPositionId = useRef<number | null>(null);
  
  const { userLocation } = useUserLocation();
  const { startLiveStream, updateStreamLocation, endLiveStream } = useLiveStreams();

  const startLocationTracking = useCallback((streamId: string) => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your device doesn't support location tracking",
        variant: "destructive"
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    watchPositionId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateStreamLocation(streamId, latitude, longitude);
      },
      (error) => {
        console.error('Location tracking error:', error);
        toast({
          title: "Location tracking error",
          description: "Failed to track your location",
          variant: "destructive"
        });
      },
      options
    );
  }, [updateStreamLocation]);

  const stopLocationTracking = useCallback(() => {
    if (watchPositionId.current !== null) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
  }, []);

  const handleStartStream = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start the live stream in database
      const streamId = await startLiveStream({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        lat: userLocation.lat,
        lng: userLocation.lng
      });

      if (streamId) {
        setCurrentStreamId(streamId);
        setIsStreaming(true);
        
        // Start location tracking
        startLocationTracking(streamId);
        
        toast({
          title: "Live stream started",
          description: "You're now live! Your location will be tracked in real-time.",
        });
      }
    } catch (error) {
      console.error('Error starting live stream:', error);
      toast({
        title: "Failed to start stream",
        description: "Please check your camera and microphone permissions",
        variant: "destructive"
      });
    }
  };

  const handleEndStream = async () => {
    if (!currentStreamId) return;

    try {
      // Stop location tracking
      stopLocationTracking();
      
      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // End the live stream in database
      await endLiveStream(currentStreamId);
      
      setIsStreaming(false);
      setCurrentStreamId(null);
      setTitle('');
      setDescription('');
      setViewerCount(0);
      
      toast({
        title: "Stream ended",
        description: "Your live stream has been ended successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error ending stream:', error);
      toast({
        title: "Error ending stream",
        description: "There was an issue ending your stream",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (isStreaming) {
      handleEndStream();
    } else {
      // Clean up media if not streaming
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopLocationTracking]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isStreaming ? 'Live Stream Active' : 'Start Live Stream'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isStreaming && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="What's happening?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell viewers what to expect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Your location will be tracked and updated in real-time</span>
              </div>
            </>
          )}

          {/* Video preview */}
          <div className="relative bg-black rounded-md overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {isStreaming && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
            
            {isStreaming && (
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
                <Users className="h-3 w-3" />
                {viewerCount}
              </div>
            )}

            {!isStreaming && !streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Camera preview will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isStreaming ? (
              <>
                <Button 
                  onClick={handleStartStream} 
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Go Live
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleEndStream} 
                variant="destructive" 
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                End Stream
              </Button>
            )}
          </div>

          {isStreaming && (
            <div className="text-sm text-muted-foreground text-center">
              <p>Your location is being tracked and shared with viewers</p>
              <p>Viewers can see your real-time movement on the map</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveStreamController;