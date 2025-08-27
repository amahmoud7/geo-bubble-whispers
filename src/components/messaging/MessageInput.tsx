import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Camera, 
  Mic, 
  MicOff,
  MapPin, 
  X,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import type { DirectMessage } from '@/hooks/useDirectMessaging';

interface MessageInputProps {
  conversationId: string;
  replyingTo?: DirectMessage | null;
  onClearReply?: () => void;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  replyingTo,
  onClearReply,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { sendMessage } = useDirectMessaging();
  const { setTypingIndicator } = useRealtimeMessaging();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Handle typing indicator
  const handleTypingIndicator = useCallback(
    debounce(() => {
      setTypingIndicator(null);
    }, 1000),
    [setTypingIndicator]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setTypingIndicator(conversationId);
    handleTypingIndicator();
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile && !audioBlob) return;

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let voiceDuration: number | null = null;

      // Upload file if selected
      if (selectedFile) {
        mediaUrl = await uploadFile(selectedFile);
        mediaType = selectedFile.type.startsWith('image/') ? 'image' : 
                   selectedFile.type.startsWith('video/') ? 'video' : 
                   'file';
      }

      // Upload voice recording if available
      if (audioBlob) {
        mediaUrl = await uploadFile(new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' }));
        mediaType = 'voice';
        voiceDuration = recordingDuration;
      }

      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim() || null,
        mediaUrl,
        mediaType,
        replyToId: replyingTo?.id,
        voiceDuration,
      });

      // Clear input
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setAudioBlob(null);
      setRecordingDuration(0);
      onClearReply?.();
      setTypingIndicator(null);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Mock upload - in real app, upload to Supabase storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
      
      setShowAttachments(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Update recording duration
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioPlaybackRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } else if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      setIsPlaying(false);
    }
  };

  const shareLocation = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await sendMessage.mutateAsync({
            conversationId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setShowAttachments(false);
        } catch (error) {
          console.error('Error sharing location:', error);
        }
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`border-t bg-background p-4 ${className}`}>
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-3 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Replying to {replyingTo.sender.name}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {replyingTo.content || (replyingTo.media_type ? `${replyingTo.media_type} message` : 'Message')}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Selected file:</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {filePreview && selectedFile.type.startsWith('image/') && (
            <img src={filePreview} alt="Preview" className="max-w-xs max-h-32 rounded object-cover" />
          )}
          
          {filePreview && selectedFile.type.startsWith('video/') && (
            <video src={filePreview} className="max-w-xs max-h-32 rounded" controls />
          )}
          
          <div className="text-xs text-muted-foreground mt-1">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </div>
        </div>
      )}

      {/* Voice recording preview */}
      {audioBlob && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Voice message:</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={deleteRecording}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playRecording}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full">
              <div className="h-full bg-blue-500 rounded-full w-1/3"></div>
            </div>
            <span className="text-xs text-muted-foreground">{formatDuration(recordingDuration)}</span>
          </div>
        </div>
      )}

      {/* Voice recording indicator */}
      {isRecording && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700">Recording...</span>
            </div>
            <span className="text-sm text-muted-foreground">{formatDuration(recordingDuration)}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="mb-1"
          onClick={() => setShowAttachments(!showAttachments)}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-muted"
            rows={1}
          />
        </div>

        {/* Voice/Send button */}
        {message.trim() || selectedFile || audioBlob ? (
          <Button
            onClick={handleSendMessage}
            disabled={sendMessage.isPending}
            className="mb-1"
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : isRecording ? (
          <Button
            variant="destructive"
            onClick={stopVoiceRecording}
            className="mb-1"
          >
            <MicOff className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={startVoiceRecording}
            className="mb-1"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Attachment options */}
      {showAttachments && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1 h-auto py-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">Photo</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1 h-auto py-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs">Camera</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1 h-auto py-3"
              onClick={shareLocation}
            >
              <MapPin className="h-6 w-6" />
              <span className="text-xs">Location</span>
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}