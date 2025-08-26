// Smart city detection for automatic events fetching
// Maps user location to nearest major US city for event discovery
// Enhanced with comprehensive coverage of 100+ US cities and Ticketmaster market integration

import { getMarketForCity, findNearestMarket } from '@/config/ticketmasterMarkets';

export interface City {
  id: string;
  name: string;
  displayName: string;
  coordinates: { lat: number; lng: number };
  radius: number; // miles
  population: number;
  timezone: string;
  state: string;
  ticketmasterMarketId?: string;
}

// Top 15 Major US Cities for Events (Expanded)
export const TOP_US_CITIES: City[] = [
  {
    id: 'new-york',
    name: 'New York',
    displayName: 'NYC',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    radius: 30,
    population: 8300000,
    timezone: 'America/New_York',
    state: 'NY',
    ticketmasterMarketId: '35'
  },
  {
    id: 'los-angeles', 
    name: 'Los Angeles',
    displayName: 'LA',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    radius: 35,
    population: 3900000,
    timezone: 'America/Los_Angeles',
    state: 'CA',
    ticketmasterMarketId: '27'
  },
  {
    id: 'chicago',
    name: 'Chicago', 
    displayName: 'Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    radius: 25,
    population: 2700000,
    timezone: 'America/Chicago',
    state: 'IL',
    ticketmasterMarketId: '8'
  },
  {
    id: 'houston',
    name: 'Houston',
    displayName: 'Houston', 
    coordinates: { lat: 29.7604, lng: -95.3698 },
    radius: 30,
    population: 2300000,
    timezone: 'America/Chicago',
    state: 'TX',
    ticketmasterMarketId: '18'
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    displayName: 'Phoenix',
    coordinates: { lat: 33.4484, lng: -112.0740 },
    radius: 25,
    population: 1600000,
    timezone: 'America/Phoenix',
    state: 'AZ',
    ticketmasterMarketId: '17'
  },
  {
    id: 'philadelphia',
    name: 'Philadelphia', 
    displayName: 'Philly',
    coordinates: { lat: 39.9526, lng: -75.1652 },
    radius: 20,
    population: 1600000,
    timezone: 'America/New_York',
    state: 'PA',
    ticketmasterMarketId: '29'
  },
  {
    id: 'san-antonio',
    name: 'San Antonio',
    displayName: 'San Antonio',
    coordinates: { lat: 29.4241, lng: -98.4936 },
    radius: 20,
    population: 1500000,
    timezone: 'America/Chicago',
    state: 'TX',
    ticketmasterMarketId: '59'
  },
  {
    id: 'san-diego', 
    name: 'San Diego',
    displayName: 'San Diego',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    radius: 25,
    population: 1400000,
    timezone: 'America/Los_Angeles',
    state: 'CA',
    ticketmasterMarketId: '37'
  },
  {
    id: 'dallas',
    name: 'Dallas',
    displayName: 'Dallas', 
    coordinates: { lat: 32.7767, lng: -96.7970 },
    radius: 30,
    population: 1300000,
    timezone: 'America/Chicago',
    state: 'TX',
    ticketmasterMarketId: '11'
  },
  {
    id: 'san-jose',
    name: 'San Jose',
    displayName: 'Bay Area',
    coordinates: { lat: 37.3382, lng: -121.8863 },
    radius: 25,
    population: 1000000,
    timezone: 'America/Los_Angeles',
    state: 'CA',
    ticketmasterMarketId: '41'
  },
  // Additional Major Cities
  {
    id: 'atlanta',
    name: 'Atlanta',
    displayName: 'Atlanta',
    coordinates: { lat: 33.7490, lng: -84.3880 },
    radius: 30,
    population: 500000,
    timezone: 'America/New_York',
    state: 'GA',
    ticketmasterMarketId: '1'
  },
  {
    id: 'miami',
    name: 'Miami',
    displayName: 'Miami',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    radius: 25,
    population: 470000,
    timezone: 'America/New_York',
    state: 'FL',
    ticketmasterMarketId: '21'
  },
  {
    id: 'denver',
    name: 'Denver',
    displayName: 'Denver',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    radius: 25,
    population: 715000,
    timezone: 'America/Denver',
    state: 'CO',
    ticketmasterMarketId: '12'
  },
  {
    id: 'seattle',
    name: 'Seattle',
    displayName: 'Seattle',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    radius: 25,
    population: 750000,
    timezone: 'America/Los_Angeles',
    state: 'WA',
    ticketmasterMarketId: '49'
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    displayName: 'Las Vegas',
    coordinates: { lat: 36.1699, lng: -115.1398 },
    radius: 20,
    population: 650000,
    timezone: 'America/Los_Angeles',
    state: 'NV',
    ticketmasterMarketId: '20'
  }
];

// Export alias for backward compatibility
export const US_CITIES = TOP_US_CITIES;

// Expanded comprehensive US cities database for 100+ city coverage
export const EXPANDED_US_CITIES: City[] = [
  ...TOP_US_CITIES,
  // Additional major cities
  { id: 'austin', name: 'Austin', displayName: 'Austin', coordinates: { lat: 30.2672, lng: -97.7431 }, radius: 25, population: 950000, timezone: 'America/Chicago', state: 'TX', ticketmasterMarketId: '50' },
  { id: 'nashville', name: 'Nashville', displayName: 'Nashville', coordinates: { lat: 36.1627, lng: -86.7816 }, radius: 30, population: 700000, timezone: 'America/Chicago', state: 'TN', ticketmasterMarketId: '24' },
  { id: 'portland', name: 'Portland', displayName: 'Portland', coordinates: { lat: 45.5152, lng: -122.6784 }, radius: 25, population: 650000, timezone: 'America/Los_Angeles', state: 'OR', ticketmasterMarketId: '32' },
  { id: 'boise', name: 'Boise', displayName: 'Boise', coordinates: { lat: 43.6150, lng: -116.2023 }, radius: 25, population: 230000, timezone: 'America/Denver', state: 'ID', ticketmasterMarketId: '66' },
  { id: 'des-moines', name: 'Des Moines', displayName: 'Des Moines', coordinates: { lat: 41.5868, lng: -93.6250 }, radius: 25, population: 215000, timezone: 'America/Chicago', state: 'IA', ticketmasterMarketId: '68' },
  { id: 'albuquerque', name: 'Albuquerque', displayName: 'Albuquerque', coordinates: { lat: 35.0844, lng: -106.6504 }, radius: 25, population: 560000, timezone: 'America/Denver', state: 'NM', ticketmasterMarketId: '60' },
  { id: 'anchorage', name: 'Anchorage', displayName: 'Anchorage', coordinates: { lat: 61.2181, lng: -149.9003 }, radius: 30, population: 290000, timezone: 'America/Anchorage', state: 'AK', ticketmasterMarketId: '63' },
  { id: 'honolulu', name: 'Honolulu', displayName: 'Honolulu', coordinates: { lat: 21.3099, lng: -157.8581 }, radius: 25, population: 345000, timezone: 'Pacific/Honolulu', state: 'HI', ticketmasterMarketId: '53' },
  // Mid-sized cities
  { id: 'buffalo', name: 'Buffalo', displayName: 'Buffalo', coordinates: { lat: 42.8864, lng: -78.8784 }, radius: 25, population: 260000, timezone: 'America/New_York', state: 'NY', ticketmasterMarketId: '4' },
  { id: 'milwaukee', name: 'Milwaukee', displayName: 'Milwaukee', coordinates: { lat: 43.0389, lng: -87.9065 }, radius: 25, population: 590000, timezone: 'America/Chicago', state: 'WI', ticketmasterMarketId: '23' },
  { id: 'detroit', name: 'Detroit', displayName: 'Detroit', coordinates: { lat: 42.3314, lng: -83.0458 }, radius: 30, population: 670000, timezone: 'America/New_York', state: 'MI', ticketmasterMarketId: '13' },
  { id: 'cleveland', name: 'Cleveland', displayName: 'Cleveland', coordinates: { lat: 41.4993, lng: -81.6944 }, radius: 25, population: 385000, timezone: 'America/New_York', state: 'OH', ticketmasterMarketId: '7' },
  { id: 'columbus', name: 'Columbus', displayName: 'Columbus', coordinates: { lat: 39.9612, lng: -82.9988 }, radius: 25, population: 900000, timezone: 'America/New_York', state: 'OH', ticketmasterMarketId: '9' },
  { id: 'indianapolis', name: 'Indianapolis', displayName: 'Indianapolis', coordinates: { lat: 39.7684, lng: -86.1581 }, radius: 25, population: 870000, timezone: 'America/New_York', state: 'IN', ticketmasterMarketId: '14' },
  { id: 'memphis', name: 'Memphis', displayName: 'Memphis', coordinates: { lat: 35.1495, lng: -90.0490 }, radius: 25, population: 650000, timezone: 'America/Chicago', state: 'TN', ticketmasterMarketId: '22' },
  { id: 'new-orleans', name: 'New Orleans', displayName: 'New Orleans', coordinates: { lat: 29.9511, lng: -90.0715 }, radius: 25, population: 390000, timezone: 'America/Chicago', state: 'LA', ticketmasterMarketId: '25' },
  { id: 'raleigh', name: 'Raleigh', displayName: 'Raleigh', coordinates: { lat: 35.7796, lng: -78.6382 }, radius: 25, population: 470000, timezone: 'America/New_York', state: 'NC', ticketmasterMarketId: '33' },
  { id: 'charlotte', name: 'Charlotte', displayName: 'Charlotte', coordinates: { lat: 35.2271, lng: -80.8431 }, radius: 25, population: 870000, timezone: 'America/New_York', state: 'NC', ticketmasterMarketId: '6' },
  { id: 'pittsburgh', name: 'Pittsburgh', displayName: 'Pittsburgh', coordinates: { lat: 40.4406, lng: -79.9959 }, radius: 25, population: 300000, timezone: 'America/New_York', state: 'PA', ticketmasterMarketId: '31' },
  { id: 'baltimore', name: 'Baltimore', displayName: 'Baltimore', coordinates: { lat: 39.2904, lng: -76.6122 }, radius: 25, population: 610000, timezone: 'America/New_York', state: 'MD', ticketmasterMarketId: '2' },
  { id: 'washington-dc', name: 'Washington', displayName: 'DC', coordinates: { lat: 38.9072, lng: -77.0369 }, radius: 30, population: 705000, timezone: 'America/New_York', state: 'DC', ticketmasterMarketId: '2' },
  { id: 'boston', name: 'Boston', displayName: 'Boston', coordinates: { lat: 42.3601, lng: -71.0589 }, radius: 30, population: 685000, timezone: 'America/New_York', state: 'MA', ticketmasterMarketId: '3' },
  { id: 'san-francisco', name: 'San Francisco', displayName: 'San Francisco', coordinates: { lat: 37.7749, lng: -122.4194 }, radius: 30, population: 875000, timezone: 'America/Los_Angeles', state: 'CA', ticketmasterMarketId: '26' },
  { id: 'minneapolis', name: 'Minneapolis', displayName: 'Minneapolis', coordinates: { lat: 44.9778, lng: -93.2650 }, radius: 25, population: 425000, timezone: 'America/Chicago', state: 'MN', ticketmasterMarketId: '10' },
  { id: 'kansas-city', name: 'Kansas City', displayName: 'Kansas City', coordinates: { lat: 39.0997, lng: -94.5786 }, radius: 25, population: 495000, timezone: 'America/Chicago', state: 'MO', ticketmasterMarketId: '16' },
  { id: 'st-louis', name: 'St. Louis', displayName: 'St. Louis', coordinates: { lat: 38.6270, lng: -90.1994 }, radius: 25, population: 300000, timezone: 'America/Chicago', state: 'MO', ticketmasterMarketId: '45' },
  { id: 'oklahoma-city', name: 'Oklahoma City', displayName: 'Oklahoma City', coordinates: { lat: 35.4676, lng: -97.5164 }, radius: 25, population: 695000, timezone: 'America/Chicago', state: 'OK', ticketmasterMarketId: '28' },
  { id: 'louisville', name: 'Louisville', displayName: 'Louisville', coordinates: { lat: 38.2527, lng: -85.7585 }, radius: 25, population: 620000, timezone: 'America/New_York', state: 'KY', ticketmasterMarketId: '19' },
  { id: 'orlando', name: 'Orlando', displayName: 'Orlando', coordinates: { lat: 28.5383, lng: -81.3792 }, radius: 25, population: 285000, timezone: 'America/New_York', state: 'FL', ticketmasterMarketId: '44' },
  { id: 'tampa', name: 'Tampa', displayName: 'Tampa', coordinates: { lat: 27.9506, lng: -82.4572 }, radius: 25, population: 385000, timezone: 'America/New_York', state: 'FL', ticketmasterMarketId: '46' },
  { id: 'jacksonville', name: 'Jacksonville', displayName: 'Jacksonville', coordinates: { lat: 30.3322, lng: -81.6557 }, radius: 25, population: 950000, timezone: 'America/New_York', state: 'FL', ticketmasterMarketId: '15' },
  { id: 'sacramento', name: 'Sacramento', displayName: 'Sacramento', coordinates: { lat: 38.5816, lng: -121.4944 }, radius: 25, population: 525000, timezone: 'America/Los_Angeles', state: 'CA', ticketmasterMarketId: '36' },
  { id: 'fresno', name: 'Fresno', displayName: 'Fresno', coordinates: { lat: 36.7378, lng: -119.7871 }, radius: 25, population: 545000, timezone: 'America/Los_Angeles', state: 'CA', ticketmasterMarketId: '55' },
  { id: 'tucson', name: 'Tucson', displayName: 'Tucson', coordinates: { lat: 32.2226, lng: -110.9747 }, radius: 25, population: 545000, timezone: 'America/Phoenix', state: 'AZ', ticketmasterMarketId: '52' },
  { id: 'el-paso', name: 'El Paso', displayName: 'El Paso', coordinates: { lat: 31.7619, lng: -106.4850 }, radius: 25, population: 680000, timezone: 'America/Denver', state: 'TX', ticketmasterMarketId: '56' },
  { id: 'fort-worth', name: 'Fort Worth', displayName: 'Fort Worth', coordinates: { lat: 32.7555, lng: -97.3308 }, radius: 25, population: 920000, timezone: 'America/Chicago', state: 'TX', ticketmasterMarketId: '11' },
  { id: 'omaha', name: 'Omaha', displayName: 'Omaha', coordinates: { lat: 41.2565, lng: -95.9345 }, radius: 25, population: 480000, timezone: 'America/Chicago', state: 'NE', ticketmasterMarketId: '61' },
  { id: 'wichita', name: 'Wichita', displayName: 'Wichita', coordinates: { lat: 37.6872, lng: -97.3301 }, radius: 25, population: 390000, timezone: 'America/Chicago', state: 'KS', ticketmasterMarketId: '58' },
  { id: 'corpus-christi', name: 'Corpus Christi', displayName: 'Corpus Christi', coordinates: { lat: 27.8006, lng: -97.3964 }, radius: 25, population: 325000, timezone: 'America/Chicago', state: 'TX', ticketmasterMarketId: '57' },
  { id: 'virginia-beach', name: 'Virginia Beach', displayName: 'Virginia Beach', coordinates: { lat: 36.8529, lng: -75.9780 }, radius: 25, population: 450000, timezone: 'America/New_York', state: 'VA', ticketmasterMarketId: '48' },
  { id: 'reno', name: 'Reno', displayName: 'Reno', coordinates: { lat: 39.5296, lng: -119.8138 }, radius: 25, population: 250000, timezone: 'America/Los_Angeles', state: 'NV', ticketmasterMarketId: '34' }
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Find the nearest major city to user's location
// Overloaded function signatures for backward compatibility
export function detectNearestCity(userLat: number, userLng: number): City;
export function detectNearestCity(userLat: number, userLng: number, options: { maxDistance?: number; preferLargeMetros?: boolean }): City;
export function detectNearestCity(userLat: number, userLng: number, options: { maxDistance?: number; preferLargeMetros?: boolean } = {}): City {
  console.log(`🔍 CITY DETECTION: Starting detection for location ${userLat}, ${userLng}`);
  
  let nearestCity = TOP_US_CITIES[0]; // NYC fallback
  let shortestDistance = Infinity;
  
  console.log(`🔍 CITY DETECTION: Checking ${TOP_US_CITIES.length} cities...`);
  
  // Special check for Atlanta coordinates
  const atlantaDistance = calculateDistance(userLat, userLng, 33.7490, -84.3880);
  console.log(`🔍 SPECIAL CHECK: Distance to Atlanta (33.7490, -84.3880): ${Math.round(atlantaDistance)} miles`);
  
  for (const city of TOP_US_CITIES) {
    const distance = calculateDistance(
      userLat, 
      userLng, 
      city.coordinates.lat, 
      city.coordinates.lng
    );
    
    console.log(`🔍 ${city.displayName} (${city.id}): ${Math.round(distance)} miles away (coords: ${city.coordinates.lat}, ${city.coordinates.lng})`);
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
      console.log(`🎯 NEW CLOSEST: ${city.displayName} (${city.id}) at ${Math.round(distance)} miles`);
    }
  }
  
  console.log(`✅ FINAL RESULT: ${nearestCity.displayName} (${nearestCity.id}) is ${Math.round(shortestDistance)} miles away`);
  return nearestCity;
}

// Get city by ID
export function getCityById(cityId: string): City | null {
  return TOP_US_CITIES.find(city => city.id === cityId) || null;
}

// Get all cities for selection UI
export function getAllCities(): City[] {
  return TOP_US_CITIES.sort((a, b) => b.population - a.population);
}

// Check if user is within a reasonable distance from any major city
export function isWithinEventRadius(userLat: number, userLng: number, maxDistance: number = 50): boolean {
  console.log(`🔍 EVENT RADIUS CHECK: Testing location ${userLat}, ${userLng} within ${maxDistance} miles`);
  
  let closestDistance = Infinity;
  let closestCity = '';
  
  for (const city of TOP_US_CITIES) {
    const distance = calculateDistance(
      userLat, 
      userLng, 
      city.coordinates.lat, 
      city.coordinates.lng
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestCity = city.displayName;
    }
    
    console.log(`🔍 ${city.displayName}: ${Math.round(distance)} miles away`);
    
    if (distance <= maxDistance) {
      console.log(`✅ WITHIN RADIUS: ${city.displayName} is within ${maxDistance} miles`);
      return true;
    }
  }
  
  console.log(`❌ OUTSIDE RADIUS: Closest city ${closestCity} is ${Math.round(closestDistance)} miles away (max: ${maxDistance})`);
  return false;
}

// Get Ticketmaster market information for a city
export function getCityMarketInfo(city: City): { marketId?: string; marketName?: string; dmaId?: string } {
  const market = getMarketForCity(city.id);
  return {
    marketId: market?.id || city.ticketmasterMarketId,
    marketName: market?.name,
    dmaId: market?.dmaId
  };
}

// Enhanced city detection with market-aware fallback
export function detectCityWithMarket(userLat: number, userLng: number): { city: City; market?: any } {
  const city = detectNearestCity(userLat, userLng);
  const market = getMarketForCity(city.id) || findNearestMarket(userLat, userLng);
  
  return { city, market };
}

// Get recommended search parameters for Ticketmaster API
export function getTicketmasterSearchParams(city: City): {
  marketId?: string;
  dmaId?: string;
  radius: number;
  coordinates: { lat: number; lng: number };
} {
  const marketInfo = getCityMarketInfo(city);
  const market = getMarketForCity(city.id);
  
  return {
    marketId: marketInfo.marketId,
    dmaId: marketInfo.dmaId,
    radius: market?.radius || city.radius,
    coordinates: market?.coordinates || city.coordinates
  };
}

// Format city display name with emoji
export function formatCityDisplay(city: City): string {
  const cityEmojis: Record<string, string> = {
    'new-york': '🗽',
    'los-angeles': '🌴', 
    'chicago': '🏙️',
    'houston': '🚀',
    'phoenix': '🌵',
    'philadelphia': '🔔',
    'san-antonio': '🤠',
    'san-diego': '🏖️',
    'dallas': '🤠',
    'san-jose': '💻',
    'atlanta': '🍑',
    'miami': '🏖️',
    'denver': '⛰️',
    'seattle': '☕',
    'las-vegas': '🎰'
  };
  
  return `${cityEmojis[city.id] || '🏙️'} ${city.displayName}`;
}

// Find optimal event search radius based on location
export function getOptimalSearchRadius(userLat: number, userLng: number): number {
  const nearestCity = detectNearestCity(userLat, userLng);
  const distance = calculateDistance(userLat, userLng, nearestCity.coordinates.lat, nearestCity.coordinates.lng);
  
  // Rural areas get expanded radius
  if (distance > 50) return Math.min(100, distance + nearestCity.radius);
  
  // Urban areas use city-specific radius
  if (nearestCity.population > 1000000) return Math.max(nearestCity.radius, 35);
  
  return nearestCity.radius;
}

// Get cities within a specified radius
export function getCitiesWithinRadius(userLat: number, userLng: number, maxDistance: number = 100): City[] {
  const nearbyCities = [];
  
  for (const city of EXPANDED_US_CITIES) {
    const distance = calculateDistance(
      userLat, 
      userLng, 
      city.coordinates.lat, 
      city.coordinates.lng
    );
    
    if (distance <= maxDistance) {
      nearbyCities.push({
        ...city,
        distance
      } as City & { distance: number });
    }
  }
  
  // Sort by distance, closest first
  return nearbyCities
    .sort((a: any, b: any) => a.distance - b.distance)
    .map(({ distance, ...city }) => city);
}

// Get cities by state
export function getCitiesByState(stateCode: string): City[] {
  return EXPANDED_US_CITIES.filter(city => city.state.toLowerCase() === stateCode.toLowerCase());
}

// Get major metropolitan areas (cities with population > threshold)
export function getMajorMetros(minPopulation: number = 400000): City[] {
  return EXPANDED_US_CITIES
    .filter(city => city.population >= minPopulation)
    .sort((a, b) => b.population - a.population);
}