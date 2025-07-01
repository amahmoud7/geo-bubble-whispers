import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LiveStream } from '@/types/livestream';
import { Users, MapPin, Clock, X } from 'lucide-react';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { formatDistanceToNow } from 'date-fns';

interface LiveStreamViewerProps {
  stream: LiveStream | null;
  isOpen: boolean;
  onClose: () => void;
}

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({
  stream,
  isOpen,
  onClose
}) => {
  const { leaveStreamAsViewer } = useLiveStreams();
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (stream && isOpen) {
      setHasJoined(true);
    }
  }, [stream, isOpen]);

  const handleClose = async () => {
    if (stream && hasJoined) {
      await leaveStreamAsViewer(stream.id);
      setHasJoined(false);
    }
    onClose();
  };

  if (!stream) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-red-500">
                  <AvatarImage src={stream.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {stream.profiles?.name?.charAt(0) || 
                     stream.profiles?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg">
                      {stream.profiles?.name || stream.profiles?.username || 'Anonymous'}
                    </DialogTitle>
                    <Badge variant="destructive" className="text-xs">
                      LIVE
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{stream.viewer_count} viewers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Video/Stream Area */}
            <div className="flex-1 bg-black flex items-center justify-center">
              {/* Placeholder for actual video stream */}
              <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse" />
                </div>
                <p className="text-lg font-semibold mb-2">Live Stream</p>
                <p className="text-sm text-gray-300">
                  This is where the actual video stream would appear
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Video streaming integration would be implemented here
                </p>
              </div>
            </div>
            
            {/* Info Panel */}
            <div className="w-80 bg-background border-l p-4 flex flex-col">
              {stream.title && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Stream Title</h3>
                  <p className="text-sm">{stream.title}</p>
                </div>
              )}
              
              {stream.description && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{stream.description}</p>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Tracking
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Started at:</span>
                    <br />
                    <span className="font-mono text-xs">
                      {stream.start_lat.toFixed(6)}, {stream.start_lng.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current location:</span>
                    <br />
                    <span className="font-mono text-xs">
                      {stream.current_lat.toFixed(6)}, {stream.current_lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <p className="text-xs text-muted-foreground text-center">
                  Watch the streamer's location update in real-time on the map
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveStreamViewer;