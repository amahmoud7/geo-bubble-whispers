import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Radio, Square, Play, Pause, Settings, Users, Eye, 
  Mic, MicOff, Video, VideoOff, Monitor, Smartphone,
  Clock, Signal, Wifi, WifiOff 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LiveStreamInterfaceProps {
  onStreamStart: (streamData: any) => void;
  onStreamEnd: () => void;
  isStreaming: boolean;
}

const LiveStreamInterface: React.FC<LiveStreamInterfaceProps> = ({
  onStreamStart,
  onStreamEnd,
  isStreaming
}) => {
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamQuality, setStreamQuality] = useState('720p');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [bitrate, setBitrate] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "Stream title required",
        description: "Please enter a title for your live stream",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: streamQuality === '1080p' ? 1920 : streamQuality === '720p' ? 1280 : 640,
          height: streamQuality === '1080p' ? 1080 : streamQuality === '720p' ? 720 : 480,
          frameRate: 30
        },
        audio: isAudioEnabled
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start timer
      setStreamDuration(0);
      timerRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);

      // Simulate viewer count updates
      const viewerInterval = setInterval(() => {
        setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
      }, 5000);

      setConnectionStatus('connected');
      setBitrate(Math.floor(Math.random() * 1000) + 500);
      
      onStreamStart({
        title: streamTitle,
        description: streamDescription,
        quality: streamQuality,
        stream
      });

      toast({
        title: "Live stream started!",
        description: "You're now broadcasting live",
      });

      // Cleanup function for viewer interval
      return () => clearInterval(viewerInterval);
    } catch (error) {
      console.error('Stream start error:', error);
      setConnectionStatus('disconnected');
      toast({
        title: "Failed to start stream",
        description: "Please check camera and microphone permissions",
        variant: "destructive"
      });
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setBitrate(0);
    
    onStreamEnd();
    
    toast({
      title: "Stream ended",
      description: `Your live stream lasted ${formatDuration(streamDuration)}`,
    });
  };

  const toggleAudio = async () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = async () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting': return <Signal className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default: return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isStreaming) {
    return (
      <div className="space-y-4">
        {/* Stream Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" />
              Go Live
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stream-title">Stream Title *</Label>
              <Input
                id="stream-title"
                placeholder="What's happening?"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {streamTitle.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-description">Description (Optional)</Label>
              <Input
                id="stream-description"
                placeholder="Tell viewers what to expect..."
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stream-quality">Quality</Label>
                <Select value={streamQuality} onValueChange={setStreamQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p (Standard)</SelectItem>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Camera Preview</Label>
                <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-md"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={startStream}
                className="bg-red-500 hover:bg-red-600 text-white px-8"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Signal className="h-4 w-4 mr-2 animate-pulse" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 mr-2" />
                    Start Live Stream
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-around">
              <Button
                variant={isAudioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="gap-2"
              >
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                Audio
              </Button>
              
              <Button
                variant={isVideoEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className="gap-2"
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                Video
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Live Streaming Interface
  return (
    <div className="space-y-4">
      {/* Live Status Banner */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor()}`}></div>
                <span className="text-red-600 font-semibold">LIVE</span>
              </div>
              <div className="text-sm text-red-600">
                {formatDuration(streamDuration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{viewerCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <span>{bitrate} kbps</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Preview */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Overlay Controls */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={isAudioEnabled ? "secondary" : "destructive"}
                    onClick={toggleAudio}
                    className="h-10 w-10 p-0"
                  >
                    {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    onClick={toggleVideo}
                    className="h-10 w-10 p-0"
                  >
                    {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopStream}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  End Stream
                </Button>
              </div>
            </div>

            {/* Stream Info Overlay */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                <h3 className="font-semibold truncate">{streamTitle}</h3>
                {streamDescription && (
                  <p className="text-sm opacity-90 truncate">{streamDescription}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                <Users className="h-5 w-5" />
                {viewerCount}
              </div>
              <p className="text-sm text-muted-foreground">Viewers</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                <Clock className="h-5 w-5" />
                {formatDuration(streamDuration)}
              </div>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStreamInterface;