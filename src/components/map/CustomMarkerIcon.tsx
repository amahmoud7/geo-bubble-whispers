import { MessageType, getMarkerColor } from './utils/messageTypeUtils';

interface CustomMarkerIconProps {
  messageType: MessageType;
  userName: string;
  mediaUrl?: string | null;
  size?: number;
}

export const createCustomMarkerIcon = ({
  messageType,
  userName,
  mediaUrl,
  size = 36
}: CustomMarkerIconProps): string => {
  const color = getMarkerColor(messageType);
  const initial = userName?.charAt(0) || '?';

  // Create SVG marker with media preview for image/video posts
  const createMarkerSVG = () => {
    if (messageType === 'text') {
      // Simple colored circle with initial for text posts
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${size/2}" y="${size/2 + 4}" font-family="Arial" font-size="${size/3}" fill="white" text-anchor="middle">${initial}</text>
      </svg>`;
    }

    // For image/video posts, create a marker with preview area
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 8}" height="${size + 8}" viewBox="0 0 ${size + 8} ${size + 8}">
      <!-- Outer border -->
      <circle cx="${(size + 8)/2}" cy="${(size + 8)/2}" r="${(size + 8)/2 - 1}" fill="white" stroke="${color}" stroke-width="2"/>
      <!-- Inner content area -->
      <circle cx="${(size + 8)/2}" cy="${(size + 8)/2}" r="${size/2 - 2}" fill="${color}" opacity="0.9"/>
      <!-- Preview placeholder (will be replaced with actual image) -->
      <circle cx="${(size + 8)/2}" cy="${(size + 8)/2}" r="${size/2 - 6}" fill="white" opacity="0.8"/>
      <text x="${(size + 8)/2}" y="${(size + 8)/2 + 2}" font-family="Arial" font-size="8" fill="${color}" text-anchor="middle">${messageType === 'video' ? '▶' : '📷'}</text>
    </svg>`;
  };

  const svgString = createMarkerSVG();
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString);
};