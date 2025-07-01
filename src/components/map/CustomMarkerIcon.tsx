import { MessageType, getMarkerColor } from './utils/messageTypeUtils';

interface CustomMarkerIconProps {
  messageType: MessageType;
  userName: string;
  mediaUrl?: string | null;
  isLivestream?: boolean;
  isLive?: boolean; // Only pulse when actually live
  size?: number;
}

export const createCustomMarkerIcon = ({
  messageType,
  userName,
  mediaUrl,
  isLivestream = false,
  isLive = false,
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

    if (messageType === 'livestream') {
      // Different marker for live vs ended livestreams
      if (isLive) {
        // Pulsing marker for active livestreams
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 12}" height="${size + 12}" viewBox="0 0 ${size + 12} ${size + 12}">
          <!-- Pulsing outer ring -->
          <circle cx="${(size + 12)/2}" cy="${(size + 12)/2}" r="${(size + 12)/2 - 1}" fill="${color}" opacity="0.3">
            <animate attributeName="r" values="${(size + 12)/2 - 8};${(size + 12)/2 - 1};${(size + 12)/2 - 8}" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
          </circle>
          <!-- Main marker -->
          <circle cx="${(size + 12)/2}" cy="${(size + 12)/2}" r="${size/2 - 1}" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Live indicator -->
          <circle cx="${(size + 12)/2}" cy="${(size + 12)/2}" r="${size/2 - 8}" fill="white" opacity="0.9"/>
          <text x="${(size + 12)/2}" y="${(size + 12)/2 + 2}" font-family="Arial" font-size="8" fill="${color}" text-anchor="middle">●</text>
          <text x="${(size + 12)/2}" y="${(size + 12)/2 - 6}" font-family="Arial" font-size="6" fill="${color}" text-anchor="middle">LIVE</text>
        </svg>`;
      } else {
        // Static blue marker for ended livestreams
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 8}" height="${size + 8}" viewBox="0 0 ${size + 8} ${size + 8}">
          <circle cx="${(size + 8)/2}" cy="${(size + 8)/2}" r="${(size + 8)/2 - 1}" fill="white" stroke="${color}" stroke-width="2"/>
          <circle cx="${(size + 8)/2}" cy="${(size + 8)/2}" r="${size/2 - 2}" fill="${color}" opacity="0.9"/>
          <circle cx="${(size + 8)/2}" cy="${(size + 8)/2}" r="${size/2 - 6}" fill="white" opacity="0.8"/>
          <text x="${(size + 8)/2}" y="${(size + 8)/2 + 2}" font-family="Arial" font-size="8" fill="${color}" text-anchor="middle">▶</text>
        </svg>`;
      }
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