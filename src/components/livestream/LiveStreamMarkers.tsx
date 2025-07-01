import React, { useEffect, useState } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveStream } from '@/types/livestream';
import { Users, Eye, Clock } from 'lucide-react';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { formatDistanceToNow } from 'date-fns';

interface LiveStreamMarkersProps {
  liveStreams: LiveStream[];
  onStreamSelect: (stream: LiveStream) => void;
  selectedStreamId: string | null;
  setSelectedStreamId: (id: string | null) => void;
}

const LiveStreamMarkers: React.FC<LiveStreamMarkersProps> = ({
  liveStreams,
  onStreamSelect,
  selectedStreamId,
  setSelectedStreamId
}) => {
  const { joinStreamAsViewer } = useLiveStreams();

  const handleMarkerClick = (stream: LiveStream) => {
    setSelectedStreamId(stream.id);
  };

  const handleWatchStream = async (stream: LiveStream) => {
    await joinStreamAsViewer(stream.id);
    onStreamSelect(stream);
    setSelectedStreamId(null);
  };

  const createLiveStreamIcon = (avatarUrl: string | undefined, userName: string | undefined) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 60;
    
    canvas.width = size;
    canvas.height = size;
    
    if (ctx) {
      // Draw pulsing blue circle (live indicator)
      const gradient = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size/2);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // blue-500
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw inner circle
      ctx.fillStyle = 'rgb(59, 130, 246)'; // blue-500
      ctx.beginPath();
      ctx.arc(size/2, size/2, 20, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add live indicator
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(size - 8, 8, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2)
    };
  };

  return (
    <>
      {liveStreams.map((stream) => (
        <React.Fragment key={stream.id}>
          <Marker
            position={{
              lat: stream.current_lat,
              lng: stream.current_lng
            }}
            icon={createLiveStreamIcon(
              stream.profiles?.avatar_url || undefined,
              stream.profiles?.name || stream.profiles?.username || undefined
            )}
            onClick={() => handleMarkerClick(stream)}
            animation={google.maps.Animation.BOUNCE}
          />
          
          {selectedStreamId === stream.id && (
            <InfoWindow
              position={{
                lat: stream.current_lat,
                lng: stream.current_lng
              }}
              onCloseClick={() => setSelectedStreamId(null)}
            >
              <div className="p-3 max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-red-500">
                    <AvatarImage src={stream.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {stream.profiles?.name?.charAt(0) || 
                       stream.profiles?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {stream.profiles?.name || stream.profiles?.username || 'Anonymous'}
                      </h3>
                      <Badge variant="destructive" className="text-xs">
                        LIVE
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{stream.viewer_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(stream.created_at), { addSuffix: false })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {stream.title && (
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {stream.title}
                  </h4>
                )}
                
                {stream.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {stream.description}
                  </p>
                )}
                
                <Button 
                  onClick={() => handleWatchStream(stream)}
                  size="sm"
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Watch Stream
                </Button>
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default LiveStreamMarkers;