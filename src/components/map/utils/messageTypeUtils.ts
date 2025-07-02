export type MessageType = 'text' | 'image' | 'video' | 'livestream' | 'event';

export const getMessageType = (mediaUrl: string | null | undefined, isLivestream?: boolean, isEvent?: boolean): MessageType => {
  // Check if this is an event first
  if (isEvent) return 'event';
  
  // Check if this is a livestream
  if (isLivestream) return 'livestream';
  
  if (!mediaUrl) return 'text';
  
  const url = mediaUrl.toLowerCase();
  
  // Check for livestream indicators (be very specific to avoid false positives)
  if (url.includes('rtmp://') || url.includes('webrtc') || url.includes('/live/') || 
      url.includes('livestream') || url.includes('live-stream')) {
    return 'livestream';
  }
  
  // Check for video extensions (including .webm for livestreams)
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || 
      url.includes('.avi') || url.includes('.mkv') || url.includes('video') ||
      url.includes('.m4v') || url.includes('.3gp')) {
    return 'video';
  }
  
  // Check for image extensions
  if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
      url.includes('.gif') || url.includes('.webp') || url.includes('.svg') ||
      url.includes('image') || url.includes('placeholder.svg')) {
    return 'image';
  }
  
  // Default to image if mediaUrl exists but type is unclear
  return 'image';
};

export const getMarkerColor = (messageType: MessageType): string => {
  switch (messageType) {
    case 'text':
      return '#DC2626'; // Red
    case 'image':
      return '#16A34A'; // Green
    case 'video':
      return '#9333EA'; // Purple
    case 'livestream':
      return '#0EA5E9'; // Blue
    case 'event':
      return '#EAB308'; // Yellow for events
    default:
      return '#0EA5E9'; // Default blue
  }
};