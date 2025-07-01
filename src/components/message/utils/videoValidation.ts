
import { toast } from '@/hooks/use-toast';

export const validateVideo = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      
      if (duration > 30) {
        toast({
          title: "Video too long",
          description: "Videos must be 30 seconds or shorter for Lo posts",
          variant: "destructive"
        });
        resolve(false);
      } else {
        resolve(true);
      }
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      toast({
        title: "Invalid video",
        description: "Please select a valid video file",
        variant: "destructive"
      });
      resolve(false);
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const validateFileSize = (file: File): boolean => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    toast({
      title: "File too large",
      description: "Please select a file smaller than 50MB",
      variant: "destructive"
    });
    return false;
  }
  return true;
};
