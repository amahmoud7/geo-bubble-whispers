import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Square, Play, Download, Trash2, Upload, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface NativeLiveStreamRecorderProps {
  onVideoRecorded: (file: File) => void;
  onClose: () => void;
}

const NativeLiveStreamRecorder: React.FC<NativeLiveStreamRecorderProps> = ({
  onVideoRecorded,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
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

  const startNativeVideoRecording = async () => {
    try {
      // For native platforms, use camera directly to record video
      const video = await CapacitorCamera.getPhoto({
        quality: 90,
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        // Note: Capacitor Camera doesn't support video recording directly
        // We would need to use @capacitor-community/media or similar plugin
      });
      
      toast({
        title: "Native Video Recording",
        description: "Video recording is not yet implemented for native platforms. Please use photo capture instead.",
        variant: "destructive"
      });
      
    } catch (error) {
      console.error('Error starting native video recording:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera for video recording. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const takeNativePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
      });

      if (image.dataUrl) {
        // Convert data URL to blob then to file
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        onVideoRecorded(file);
        toast({
          title: "Photo Captured",
          description: "Photo successfully captured using native camera.",
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions in Settings.",
        variant: "destructive"
      });
    }
  };

  const startWebRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
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
        setShowOptions(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Video recording has begun. Tap stop when finished.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please check camera permissions.",
        variant: "destructive"
      });
    }
  };

  const startRecording = async () => {
    if (isNative) {
      await startNativeVideoRecording();
    } else {
      await startWebRecording();
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
    }
  };

  const handleUseRecording = () => {
    if (recordedVideo) {
      const file = new File([recordedVideo], `recording_${Date.now()}.webm`, {
        type: recordedVideo.type
      });
      onVideoRecorded(file);
      toast({
        title: "Video Saved",
        description: "Your recorded video has been added to the message.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setRecordedVideo(null);
    setPreviewUrl(null);
    setShowOptions(false);
    setRecordingDuration(0);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {isNative ? 'Native Camera' : 'Live Recording'}
            </h3>
            {isNative && (
              <p className="text-sm text-muted-foreground mb-4">
                Using native camera for best quality
              </p>
            )}
          </div>

          {!showOptions && (
            <>
              {!isNative && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {isNative && (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div className="flex justify-center items-center space-x-4">
                {isRecording && (
                  <div className="text-red-500 font-mono text-lg">
                    {formatTime(recordingDuration)}
                  </div>
                )}
                
                {isNative ? (
                  <Button onClick={takeNativePhoto} size="lg" className="rounded-full">
                    <Camera className="w-6 h-6 mr-2" />
                    Take Photo
                  </Button>
                ) : (
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    className="rounded-full"
                  >
                    {isRecording ? (
                      <Square className="w-6 h-6" />
                    ) : (
                      <Video className="w-6 h-6" />
                    )}
                  </Button>
                )}
              </div>
            </>
          )}

          {showOptions && previewUrl && !isNative && (
            <>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-center space-x-2">
                <Button onClick={handleRetry} variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={handleUseRecording}>
                  <Upload className="w-4 h-4 mr-2" />
                  Use Video
                </Button>
              </div>
            </>
          )}

          <div className="flex justify-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NativeLiveStreamRecorder;