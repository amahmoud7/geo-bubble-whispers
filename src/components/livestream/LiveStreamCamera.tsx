import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Users, 
  Eye,
  Settings,
  Maximize2,
  RotateCcw,
  Zap,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LiveStreamCameraProps {
  onStreamStart?: (streamData: MediaStream) => void;
  onStreamEnd?: () => void;
  onClose?: () => void;
  isStreaming: boolean;
  viewerCount?: number;
  streamTitle?: string;
  onTitleChange?: (title: string) => void;
}

const LiveStreamCamera: React.FC<LiveStreamCameraProps> = ({
  onStreamStart,
  onStreamEnd,
  onClose,
  isStreaming,
  viewerCount = 0,
  streamTitle = '',
  onTitleChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [title, setTitle] = useState(streamTitle);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Timer for stream duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    } else {
      setStreamDuration(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableDevices(videoDevices);
      } catch (error) {
        console.error('Error getting devices:', error);
      }
    };
    getDevices();
  }, []);

  // Initialize camera on mount (with permission request)
  useEffect(() => {
    if (!showPermissionDialog && !permissionDenied) {
      requestPermissionsAndInitialize();
    }
    return () => {
      stopCamera();
    };
  }, [currentCamera]);
  
  const requestPermissionsAndInitialize = async () => {
    setShowPermissionDialog(true);
  };
  
  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false);
    setPermissionDenied(false);
    await initializeCamera();
  };
  
  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
    setPermissionDenied(true);
    setHasPermission(false);
  };

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setHasPermission(true);
      setPermissionDenied(false);
      
      toast({
        title: "Camera & Microphone Ready!",
        description: "You can now start livestreaming",
      });

    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      setPermissionDenied(true);
      
      let errorMessage = "Please allow camera and microphone access";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera and microphone access was denied. Please enable permissions in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera or microphone found on this device.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera or microphone is already in use by another application.";
      }
      
      toast({
        title: "Camera & Microphone Access Required",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const switchCamera = () => {
    setCurrentCamera(prev => prev === 'user' ? 'environment' : 'user');
  };

  const startStream = () => {
    if (!streamRef.current) {
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your livestream",
        variant: "destructive"
      });
      return;
    }

    onStreamStart?.(streamRef.current);
    onTitleChange?.(title);
    
    toast({
      title: "Live stream started!",
      description: "You're now broadcasting live to your location",
    });
  };

  const stopStream = () => {
    onStreamEnd?.();
    setStreamDuration(0);
    
    toast({
      title: "Live stream ended",
      description: "Your broadcast has been stopped",
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Permission Dialog
  if (showPermissionDialog) {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera & Microphone Access Required</h3>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          To start livestreaming, this app needs access to your camera and microphone. 
          Your browser will ask for permission when you click "Allow Access".
        </p>
        <div className="space-y-2 text-xs text-gray-500 mb-6">
          <div className="flex items-center justify-center space-x-1">
            <Video className="h-3 w-3" />
            <span>Camera: To broadcast your video</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Mic className="h-3 w-3" />
            <span>Microphone: To broadcast your audio</span>
          </div>
        </div>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={handlePermissionDenied}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePermissionGranted}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>Allow Access</span>
            <Video className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
  
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-gray-600">Setting up camera...</span>
      </div>
    );
  }

  if (hasPermission === false || permissionDenied) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera & Microphone Access Denied</h3>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          Livestreaming requires camera and microphone permissions. Please:
        </p>
        <div className="text-left text-xs text-gray-600 bg-white p-3 rounded border mb-6 space-y-1">
          <div>1. Click the camera icon in your browser's address bar</div>
          <div>2. Select "Allow" for both camera and microphone</div>
          <div>3. Refresh the page if needed</div>
        </div>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={() => setShowPermissionDialog(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Preview */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Stream Status Overlay */}
        {isStreaming && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            {/* Live Badge */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                LIVE
              </div>
              <span className="bg-black/50 text-white px-2 py-1 rounded text-sm">
                {formatDuration(streamDuration)}
              </span>
            </div>

            {/* Viewer Count */}
            <div className="flex items-center bg-black/50 text-white px-2 py-1 rounded text-sm">
              <Eye className="h-3 w-3 mr-1" />
              {viewerCount}
            </div>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stream Title Input */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your stream about?"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          maxLength={100}
          disabled={isStreaming}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {title.length}/100
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          {/* Media Controls */}
          <div className="flex space-x-2">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                isAudioEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {availableDevices.length > 1 && (
              <button
                onClick={switchCamera}
                className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                disabled={isStreaming}
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Stream Control */}
          <div>
            {!isStreaming ? (
              <button
                onClick={startStream}
                disabled={!hasPermission || isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full font-semibold transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Go Live</span>
              </button>
            ) : (
              <button
                onClick={stopStream}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-black text-white rounded-full font-semibold transition-colors"
              >
                <Square className="h-4 w-4" />
                <span>End Stream</span>
              </button>
            )}
          </div>
        </div>

        {/* Stream Stats (when live) */}
        {isStreaming && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
              </div>
              <div>Duration: {formatDuration(streamDuration)}</div>
            </div>
            <div className="text-emerald-600 font-medium">
              Broadcasting live
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamCamera;