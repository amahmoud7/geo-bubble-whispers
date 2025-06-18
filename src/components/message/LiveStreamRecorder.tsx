
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Live, Square, Play, Download, Trash2, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LiveStreamRecorderProps {
  onVideoRecorded: (file: File) => void;
  onClose: () => void;
}

const LiveStreamRecorder: React.FC<LiveStreamRecorderProps> = ({
  onVideoRecorded,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedVideo(blob);
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        if (recordingDuration < 10) {
          setShowOptions(true);
        } else {
          // Auto-upload for longer videos
          const file = new File([blob], `live-stream-${Date.now()}.webm`, { type: 'video/webm' });
          onVideoRecorded(file);
          toast({
            title: "Live stream recorded",
            description: "Your live stream has been added to your Lo post",
          });
          onClose();
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Live stream started",
        description: "Recording your live stream...",
      });
    } catch (error) {
      console.error('Error starting live stream:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access to start live streaming",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleUploadToLo = () => {
    if (recordedVideo) {
      const file = new File([recordedVideo], `live-stream-${Date.now()}.webm`, { type: 'video/webm' });
      onVideoRecorded(file);
      toast({
        title: "Video added to Lo",
        description: "Your live stream clip has been added to your Lo post",
      });
      onClose();
    }
  };

  const handleSaveLocally = () => {
    if (recordedVideo && previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `live-stream-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Video saved",
        description: "Your live stream clip has been saved to your device",
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedVideo(null);
    setPreviewUrl(null);
    setShowOptions(false);
    
    toast({
      title: "Video deleted",
      description: "Your live stream clip has been deleted",
    });
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showOptions && recordedVideo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Live Stream Recorded</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your live stream was {formatTime(recordingDuration)} long. What would you like to do?
            </p>
          </div>
          
          {previewUrl && (
            <video
              src={previewUrl}
              controls
              className="w-full rounded-md max-h-48"
              muted
            />
          )}
          
          <div className="space-y-2">
            <Button onClick={handleUploadToLo} className="w-full" variant="default">
              <Upload className="h-4 w-4 mr-2" />
              Upload to Lo Post
            </Button>
            <Button onClick={handleSaveLocally} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Save to Device
            </Button>
            <Button onClick={handleDelete} className="w-full" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Live Stream</h3>
          {isRecording && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-500 font-medium">
                LIVE • {formatTime(recordingDuration)}
              </span>
            </div>
          )}
        </div>
        
        <div className="relative bg-black rounded-md overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {!isRecording && !recordedVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Live className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Ready to go live</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg" className="bg-red-500 hover:bg-red-600">
              <Live className="h-4 w-4 mr-2" />
              Start Live Stream
            </Button>
          ) : (
            <Button onClick={stopRecording} size="lg" variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Stop Stream
            </Button>
          )}
          <Button onClick={onClose} variant="outline" size="lg">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamRecorder;
