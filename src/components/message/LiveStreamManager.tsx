import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Download, Upload, Trash2 } from 'lucide-react';
import { eventBus } from '@/utils/eventBus';

interface LiveStreamManagerProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClose: () => void;
}

interface RecordedStream {
  blob: Blob;
  url: string;
  duration: number;
}

const LiveStreamManager: React.FC<LiveStreamManagerProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onClose
}) => {
  const [showPostStreamDialog, setShowPostStreamDialog] = useState(false);
  const [recordedStream, setRecordedStream] = useState<RecordedStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  const startLiveStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      streamRef.current = stream;
      recordedChunksRef.current = [];
      
      // Create MediaRecorder to record the stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const duration = Date.now() - startTimeRef.current;
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setRecordedStream({
          blob,
          url,
          duration
        });
        
        setShowPostStreamDialog(true);
        setIsLive(false);
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsLive(true);
      onStartRecording();
      
      toast({
        title: "Livestream started",
        description: "Your livestream is now live and being recorded",
      });
      
    } catch (error) {
      console.error('Error starting livestream:', error);
      toast({
        title: "Failed to start livestream",
        description: "Please check your camera and microphone permissions",
        variant: "destructive"
      });
    }
  }, [onStartRecording]);

  const stopLiveStream = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    onStopRecording();
    
    toast({
      title: "Livestream ended",
      description: "Choose what to do with your recorded stream",
    });
  }, [onStopRecording]);

  const handlePostAsVideo = useCallback(() => {
    if (!recordedStream) return;
    
    // Convert recorded stream to video file for posting
    const file = new File([recordedStream.blob], `livestream-${Date.now()}.webm`, {
      type: 'video/webm'
    });
    
    // Create synthetic file event for the MediaUpload component
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    const changeEvent = new Event('change', { bubbles: true });
    Object.defineProperty(changeEvent, 'target', { value: fileInput });
    
    // Dispatch custom event that the parent can listen for
    eventBus.emit('livestreamVideoReady', { file, event: changeEvent });
    
    // Clean up
    URL.revokeObjectURL(recordedStream.url);
    setRecordedStream(null);
    setShowPostStreamDialog(false);
    onClose();
    
    toast({
      title: "Video ready to post",
      description: "Your livestream has been converted to a video post",
    });
  }, [recordedStream, onClose]);

  const handleSaveLocally = useCallback(() => {
    if (!recordedStream) return;
    
    const link = document.createElement('a');
    link.href = recordedStream.url;
    link.download = `livestream-${new Date().toISOString().slice(0, 19)}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(recordedStream.url);
    setRecordedStream(null);
    setShowPostStreamDialog(false);
    onClose();
    
    toast({
      title: "Video saved",
      description: "Your livestream has been downloaded to your device",
    });
  }, [recordedStream, onClose]);

  const handleDelete = useCallback(() => {
    if (!recordedStream) return;
    
    URL.revokeObjectURL(recordedStream.url);
    setRecordedStream(null);
    setShowPostStreamDialog(false);
    onClose();
    
    toast({
      title: "Video deleted",
      description: "Your livestream recording has been deleted",
    });
  }, [recordedStream, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedStream) {
        URL.revokeObjectURL(recordedStream.url);
      }
    };
  }, [recordedStream]);

  return (
    <>
      {/* Post-livestream decision dialog */}
      <Dialog open={showPostStreamDialog} onOpenChange={setShowPostStreamDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Livestream Ended</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your livestream has been recorded. What would you like to do with the video?
            </p>
            
            {recordedStream && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  Duration: {Math.round(recordedStream.duration / 1000)}s
                </p>
                <video 
                  src={recordedStream.url} 
                  className="w-full h-32 object-cover rounded mt-2"
                  controls
                  muted
                />
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button onClick={handlePostAsVideo} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Post as Video at Location
              </Button>
              
              <Button onClick={handleSaveLocally} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Save to Device
              </Button>
              
              <Button onClick={handleDelete} variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Recording
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export functions for parent component to use */}
      {React.createElement('div', {
        'data-livestream-manager': true,
        'data-is-live': isLive,
        'data-start-stream': startLiveStream,
        'data-stop-stream': stopLiveStream,
        style: { display: 'none' }
      })}
    </>
  );
};

export default LiveStreamManager;