// Smart city detection for automatic events fetching
// Maps user location to nearest major US city for event discovery

export interface City {
  id: string;
  name: string;
  displayName: string;
  coordinates: { lat: number; lng: number };
  radius: number; // miles
  population: number;
  timezone: string;
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
    timezone: 'America/New_York'
  },
  {
    id: 'los-angeles', 
    name: 'Los Angeles',
    displayName: 'LA',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    radius: 35,
    population: 3900000,
    timezone: 'America/Los_Angeles'
  },
  {
    id: 'chicago',
    name: 'Chicago', 
    displayName: 'Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    radius: 25,
    population: 2700000,
    timezone: 'America/Chicago'
  },
  {
    id: 'houston',
    name: 'Houston',
    displayName: 'Houston', 
    coordinates: { lat: 29.7604, lng: -95.3698 },
    radius: 30,
    population: 2300000,
    timezone: 'America/Chicago'
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    displayName: 'Phoenix',
    coordinates: { lat: 33.4484, lng: -112.0740 },
    radius: 25,
    population: 1600000,
    timezone: 'America/Phoenix'
  },
  {
    id: 'philadelphia',
    name: 'Philadelphia', 
    displayName: 'Philly',
    coordinates: { lat: 39.9526, lng: -75.1652 },
    radius: 20,
    population: 1600000,
    timezone: 'America/New_York'
  },
  {
    id: 'san-antonio',
    name: 'San Antonio',
    displayName: 'San Antonio',
    coordinates: { lat: 29.4241, lng: -98.4936 },
    radius: 20,
    population: 1500000,
    timezone: 'America/Chicago'
  },
  {
    id: 'san-diego', 
    name: 'San Diego',
    displayName: 'San Diego',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    radius: 25,
    population: 1400000,
    timezone: 'America/Los_Angeles'
  },
  {
    id: 'dallas',
    name: 'Dallas',
    displayName: 'Dallas', 
    coordinates: { lat: 32.7767, lng: -96.7970 },
    radius: 30,
    population: 1300000,
    timezone: 'America/Chicago'
  },
  {
    id: 'san-jose',
    name: 'San Jose',
    displayName: 'Bay Area',
    coordinates: { lat: 37.3382, lng: -121.8863 },
    radius: 25,
    population: 1000000,
    timezone: 'America/Los_Angeles'
  },
  // Additional Major Cities
  {
    id: 'atlanta',
    name: 'Atlanta',
    displayName: 'Atlanta',
    coordinates: { lat: 33.7490, lng: -84.3880 },
    radius: 30,
    population: 500000,
    timezone: 'America/New_York'
  },
  {
    id: 'miami',
    name: 'Miami',
    displayName: 'Miami',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    radius: 25,
    population: 470000,
    timezone: 'America/New_York'
  },
  {
    id: 'denver',
    name: 'Denver',
    displayName: 'Denver',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    radius: 25,
    population: 715000,
    timezone: 'America/Denver'
  },
  {
    id: 'seattle',
    name: 'Seattle',
    displayName: 'Seattle',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    radius: 25,
    population: 750000,
    timezone: 'America/Los_Angeles'
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    displayName: 'Las Vegas',
    coordinates: { lat: 36.1699, lng: -115.1398 },
    radius: 20,
    population: 650000,
    timezone: 'America/Los_Angeles'
  }
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
export function detectNearestCity(userLat: number, userLng: number): City {
  console.log(`🔍 CITY DETECTION: Starting detection for location ${userLat}, ${userLng}`);
  
  let nearestCity = TOP_US_CITIES[0]; // NYC (only fallback used in algorithm)
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