import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Setup MSW for API mocking
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock Google Maps API
global.google = {
  maps: {
    Map: class MockMap {
      constructor() {}
      setCenter() {}
      setZoom() {}
      addListener() {}
      removeListener() {}
    },
    Marker: class MockMarker {
      constructor() {}
      setPosition() {}
      setMap() {}
    },
    InfoWindow: class MockInfoWindow {
      constructor() {}
      open() {}
      close() {}
    },
    LatLng: class MockLatLng {
      constructor(public lat: number, public lng: number) {}
      lat() { return this.lat; }
      lng() { return this.lng; }
    },
    LatLngBounds: class MockLatLngBounds {
      constructor() {}
      extend() {}
      getCenter() { return new global.google.maps.LatLng(40.7128, -74.0060); }
    },
    event: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
} as any;

// Mock environment variables
process.env.VITE_GOOGLE_MAPS_API_KEY = 'test-google-maps-key';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';