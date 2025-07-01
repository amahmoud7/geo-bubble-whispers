export type MessageType = 'text' | 'image' | 'video';

export const getMessageType = (mediaUrl: string | null | undefined): MessageType => {
  if (!mediaUrl) return 'text';
  
  const url = mediaUrl.toLowerCase();
  
  // Check for video extensions
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || 
      url.includes('.avi') || url.includes('.mkv') || url.includes('video')) {
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
    default:
      return '#0EA5E9'; // Default blue
  }
};