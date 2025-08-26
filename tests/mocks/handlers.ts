import { http, HttpResponse } from 'msw';

// Mock Ticketmaster API responses for different cities
const mockTicketmasterResponses: Record<string, any> = {
  'new-york': {
    _embedded: {
      events: [
        {
          id: 'tm-ny-001',
          name: 'Broadway Show - NYC',
          url: 'https://ticketmaster.com/event/001',
          dates: {
            start: {
              dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }
          },
          _embedded: {
            venues: [{
              name: 'Broadway Theater',
              location: { latitude: '40.7589', longitude: '-73.9851' },
              address: { line1: '123 Broadway' },
              city: { name: 'New York' },
              state: { stateCode: 'NY' }
            }]
          },
          images: [{ url: 'https://example.com/image1.jpg', width: 400 }],
          classifications: [{ 
            segment: { name: 'Arts & Theatre' },
            genre: { name: 'Theatre' }
          }],
          priceRanges: [{ min: 50, max: 200 }]
        }
      ]
    },
    page: { totalPages: 1 }
  },
  'los-angeles': {
    _embedded: {
      events: [
        {
          id: 'tm-la-001',
          name: 'Concert at Hollywood Bowl',
          url: 'https://ticketmaster.com/event/002',
          dates: {
            start: {
              dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            }
          },
          _embedded: {
            venues: [{
              name: 'Hollywood Bowl',
              location: { latitude: '34.1122', longitude: '-118.3391' },
              address: { line1: '2301 Highland Ave' },
              city: { name: 'Los Angeles' },
              state: { stateCode: 'CA' }
            }]
          },
          images: [{ url: 'https://example.com/image2.jpg', width: 400 }],
          classifications: [{ 
            segment: { name: 'Music' },
            genre: { name: 'Rock' }
          }],
          priceRanges: [{ min: 75, max: 300 }]
        }
      ]
    },
    page: { totalPages: 1 }
  },
  'chicago': {
    _embedded: {
      events: [
        {
          id: 'tm-chi-001',
          name: 'Bulls vs Lakers - Chicago',
          url: 'https://ticketmaster.com/event/003',
          dates: {
            start: {
              dateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
            }
          },
          _embedded: {
            venues: [{
              name: 'United Center',
              location: { latitude: '41.8807', longitude: '-87.6742' },
              address: { line1: '1901 W Madison St' },
              city: { name: 'Chicago' },
              state: { stateCode: 'IL' }
            }]
          },
          images: [{ url: 'https://example.com/image3.jpg', width: 400 }],
          classifications: [{ 
            segment: { name: 'Sports' },
            genre: { name: 'Basketball' }
          }],
          priceRanges: [{ min: 35, max: 500 }]
        }
      ]
    },
    page: { totalPages: 1 }
  },
  'default': {
    _embedded: { events: [] },
    page: { totalPages: 1 }
  }
};

// Mock Supabase responses
const mockSupabaseResponses = {
  'fetch-events': {
    success: true,
    events: { total: 5 },
    created: 2,
    fetched: 5
  },
  'fetch-events-realtime': {
    success: true,
    events: { total: 8 },
    location: {
      detectedCity: 'new-york',
      marketInfo: { id: '35' }
    },
    sources: {
      processed: ['ticketmaster'],
      failed: []
    }
  }
};

export const handlers = [
  // Ticketmaster API mock
  http.get('https://app.ticketmaster.com/discovery/v2/events.json', ({ request }) => {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('latlong')?.split(',')[0] || '0');
    const lng = parseFloat(url.searchParams.get('latlong')?.split(',')[1] || '0');
    const marketId = url.searchParams.get('marketId');
    
    // Determine which city based on coordinates or market ID
    let cityKey = 'default';
    
    if (marketId) {
      const marketToCityMap: Record<string, string> = {
        '35': 'new-york',
        '27': 'los-angeles', 
        '8': 'chicago'
      };
      cityKey = marketToCityMap[marketId] || 'default';
    } else if (lat && lng) {
      // Simple distance-based city detection for mocking
      const cities = [
        { key: 'new-york', lat: 40.7128, lng: -74.0060 },
        { key: 'los-angeles', lat: 34.0522, lng: -118.2437 },
        { key: 'chicago', lat: 41.8781, lng: -87.6298 }
      ];
      
      let minDistance = Infinity;
      for (const city of cities) {
        const distance = Math.sqrt(
          Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          cityKey = city.key;
        }
      }
    }
    
    return HttpResponse.json(mockTicketmasterResponses[cityKey] || mockTicketmasterResponses.default);
  }),

  // Supabase function mocks
  http.post('https://test.supabase.co/functions/v1/fetch-events', () => {
    return HttpResponse.json(mockSupabaseResponses['fetch-events']);
  }),

  http.post('https://test.supabase.co/functions/v1/fetch-events-realtime', ({ request }) => {
    return HttpResponse.json(mockSupabaseResponses['fetch-events-realtime']);
  }),

  // Error scenarios for testing
  http.get('https://app.ticketmaster.com/discovery/v2/events.json', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('test-error') === 'rate-limit') {
      return new HttpResponse(null, { 
        status: 429, 
        headers: { 'Retry-After': '60' }
      });
    }
    if (url.searchParams.get('test-error') === 'server-error') {
      return new HttpResponse(null, { status: 500 });
    }
    if (url.searchParams.get('test-error') === 'timeout') {
      // Simulate timeout by delaying response
      return new Promise(() => {}); // Never resolves
    }
    
    // Default success response
    return HttpResponse.json(mockTicketmasterResponses.default);
  }),
];