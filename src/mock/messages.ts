
export const mockMessages = [
  {
    id: '1',
    position: { x: 40.7829, y: -73.9654 },
    user: {
      name: 'Alex Smith',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Just spotted a great street performance here! 🎸',
    mediaUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
    isPublic: true,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 82800000).toISOString(),
    location: 'Central Park, New York',
  },
  {
    id: '2',
    position: { x: 47.6062, y: -122.3321 },
    user: {
      name: 'Jordan Lee',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'This coffee shop has the best latte in town! ☕️',
    mediaUrl: '',
    isPublic: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: new Date(Date.now() + 79200000).toISOString(),
    location: 'Downtown, Seattle',
  },
  {
    id: '3',
    position: { x: 34.0259, y: -118.7798 },
    user: {
      name: 'Taylor Swift',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Amazing sunset view from this spot! 🌅',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    isPublic: false,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    expiresAt: new Date(Date.now() + 75600000).toISOString(),
    location: 'Malibu Beach, California',
  },
];
