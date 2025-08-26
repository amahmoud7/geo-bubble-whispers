// Comprehensive Ticketmaster Market ID mappings for US cities
// This ensures optimal event discovery by using market-specific searches
// when supported by the Ticketmaster Discovery API

export interface TicketmasterMarket {
  id: string;
  name: string;
  dmaId: string; // Designated Market Area ID
  cities: string[]; // City IDs that belong to this market
  primaryCity: string; // Main city for this market
  coordinates: { lat: number; lng: number };
  radius: number; // Recommended search radius for this market
}

// Major US Markets with Ticketmaster Market IDs
export const TICKETMASTER_MARKETS: TicketmasterMarket[] = [
  {
    id: '1',
    name: 'Atlanta',
    dmaId: '524',
    cities: ['atlanta', 'columbus-ga'],
    primaryCity: 'atlanta',
    coordinates: { lat: 33.7490, lng: -84.3880 },
    radius: 40
  },
  {
    id: '2',
    name: 'Baltimore/Washington',
    dmaId: '511',
    cities: ['baltimore', 'washington-dc'],
    primaryCity: 'washington-dc',
    coordinates: { lat: 38.9072, lng: -77.0369 },
    radius: 45
  },
  {
    id: '3',
    name: 'Boston',
    dmaId: '506',
    cities: ['boston'],
    primaryCity: 'boston',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    radius: 40
  },
  {
    id: '4',
    name: 'Buffalo/Rochester',
    dmaId: '514',
    cities: ['buffalo', 'rochester'],
    primaryCity: 'buffalo',
    coordinates: { lat: 42.8864, lng: -78.8784 },
    radius: 35
  },
  {
    id: '6',
    name: 'Charlotte/Greensboro',
    dmaId: '517',
    cities: ['charlotte', 'winston-salem'],
    primaryCity: 'charlotte',
    coordinates: { lat: 35.2271, lng: -80.8431 },
    radius: 40
  },
  {
    id: '7',
    name: 'Cleveland',
    dmaId: '510',
    cities: ['cleveland', 'toledo'],
    primaryCity: 'cleveland',
    coordinates: { lat: 41.4993, lng: -81.6944 },
    radius: 35
  },
  {
    id: '8',
    name: 'Chicago',
    dmaId: '602',
    cities: ['chicago', 'milwaukee'],
    primaryCity: 'chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    radius: 50
  },
  {
    id: '9',
    name: 'Columbus',
    dmaId: '535',
    cities: ['columbus'],
    primaryCity: 'columbus',
    coordinates: { lat: 39.9612, lng: -82.9988 },
    radius: 35
  },
  {
    id: '10',
    name: 'Twin Cities',
    dmaId: '613',
    cities: ['minneapolis', 'st-paul'],
    primaryCity: 'minneapolis',
    coordinates: { lat: 44.9778, lng: -93.2650 },
    radius: 40
  },
  {
    id: '11',
    name: 'Dallas/Fort Worth',
    dmaId: '623',
    cities: ['dallas', 'fort-worth', 'arlington', 'plano', 'garland', 'irving'],
    primaryCity: 'dallas',
    coordinates: { lat: 32.7767, lng: -96.7970 },
    radius: 50
  },
  {
    id: '12',
    name: 'Denver',
    dmaId: '751',
    cities: ['denver', 'colorado-springs'],
    primaryCity: 'denver',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    radius: 40
  },
  {
    id: '13',
    name: 'Detroit',
    dmaId: '505',
    cities: ['detroit'],
    primaryCity: 'detroit',
    coordinates: { lat: 42.3314, lng: -83.0458 },
    radius: 40
  },
  {
    id: '14',
    name: 'Indianapolis',
    dmaId: '527',
    cities: ['indianapolis', 'fort-wayne'],
    primaryCity: 'indianapolis',
    coordinates: { lat: 39.7684, lng: -86.1581 },
    radius: 35
  },
  {
    id: '15',
    name: 'Jacksonville',
    dmaId: '561',
    cities: ['jacksonville'],
    primaryCity: 'jacksonville',
    coordinates: { lat: 30.3322, lng: -81.6557 },
    radius: 35
  },
  {
    id: '16',
    name: 'Kansas City',
    dmaId: '616',
    cities: ['kansas-city'],
    primaryCity: 'kansas-city',
    coordinates: { lat: 39.0997, lng: -94.5786 },
    radius: 35
  },
  {
    id: '17',
    name: 'Phoenix',
    dmaId: '753',
    cities: ['phoenix', 'mesa', 'scottsdale', 'glendale', 'chandler', 'gilbert', 'tucson'],
    primaryCity: 'phoenix',
    coordinates: { lat: 33.4484, lng: -112.0740 },
    radius: 50
  },
  {
    id: '18',
    name: 'Houston',
    dmaId: '618',
    cities: ['houston'],
    primaryCity: 'houston',
    coordinates: { lat: 29.7604, lng: -95.3698 },
    radius: 45
  },
  {
    id: '19',
    name: 'Louisville',
    dmaId: '529',
    cities: ['louisville', 'lexington'],
    primaryCity: 'louisville',
    coordinates: { lat: 38.2527, lng: -85.7585 },
    radius: 35
  },
  {
    id: '20',
    name: 'Las Vegas',
    dmaId: '839',
    cities: ['las-vegas', 'henderson', 'north-las-vegas'],
    primaryCity: 'las-vegas',
    coordinates: { lat: 36.1699, lng: -115.1398 },
    radius: 35
  },
  {
    id: '21',
    name: 'Miami/Fort Lauderdale',
    dmaId: '528',
    cities: ['miami', 'hialeah'],
    primaryCity: 'miami',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    radius: 40
  },
  {
    id: '22',
    name: 'Memphis',
    dmaId: '640',
    cities: ['memphis'],
    primaryCity: 'memphis',
    coordinates: { lat: 35.1495, lng: -90.0490 },
    radius: 35
  },
  {
    id: '23',
    name: 'Milwaukee',
    dmaId: '617',
    cities: ['milwaukee', 'madison'],
    primaryCity: 'milwaukee',
    coordinates: { lat: 43.0389, lng: -87.9065 },
    radius: 35
  },
  {
    id: '24',
    name: 'Nashville',
    dmaId: '659',
    cities: ['nashville', 'knoxville'],
    primaryCity: 'nashville',
    coordinates: { lat: 36.1627, lng: -86.7816 },
    radius: 40
  },
  {
    id: '25',
    name: 'New Orleans',
    dmaId: '622',
    cities: ['new-orleans', 'baton-rouge'],
    primaryCity: 'new-orleans',
    coordinates: { lat: 29.9511, lng: -90.0715 },
    radius: 35
  },
  {
    id: '26',
    name: 'San Francisco Bay Area',
    dmaId: '807',
    cities: ['san-francisco', 'san-jose', 'oakland', 'fremont'],
    primaryCity: 'san-francisco',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    radius: 50
  },
  {
    id: '27',
    name: 'Los Angeles',
    dmaId: '803',
    cities: ['los-angeles', 'long-beach', 'anaheim', 'santa-ana', 'riverside', 'san-bernardino', 'oxnard', 'fontana'],
    primaryCity: 'los-angeles',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    radius: 60
  },
  {
    id: '28',
    name: 'Oklahoma City',
    dmaId: '650',
    cities: ['oklahoma-city'],
    primaryCity: 'oklahoma-city',
    coordinates: { lat: 35.4676, lng: -97.5164 },
    radius: 35
  },
  {
    id: '29',
    name: 'Philadelphia',
    dmaId: '504',
    cities: ['philadelphia'],
    primaryCity: 'philadelphia',
    coordinates: { lat: 39.9526, lng: -75.1652 },
    radius: 40
  },
  {
    id: '31',
    name: 'Pittsburgh',
    dmaId: '508',
    cities: ['pittsburgh'],
    primaryCity: 'pittsburgh',
    coordinates: { lat: 40.4406, lng: -79.9959 },
    radius: 35
  },
  {
    id: '32',
    name: 'Portland',
    dmaId: '820',
    cities: ['portland', 'spokane', 'tacoma'],
    primaryCity: 'portland',
    coordinates: { lat: 45.5152, lng: -122.6784 },
    radius: 40
  },
  {
    id: '33',
    name: 'Raleigh/Durham',
    dmaId: '560',
    cities: ['raleigh', 'durham', 'fayetteville'],
    primaryCity: 'raleigh',
    coordinates: { lat: 35.7796, lng: -78.6382 },
    radius: 35
  },
  {
    id: '34',
    name: 'Reno',
    dmaId: '811',
    cities: ['reno'],
    primaryCity: 'reno',
    coordinates: { lat: 39.5296, lng: -119.8138 },
    radius: 30
  },
  {
    id: '35',
    name: 'New York',
    dmaId: '501',
    cities: ['new-york', 'newark', 'jersey-city'],
    primaryCity: 'new-york',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    radius: 60
  },
  {
    id: '36',
    name: 'Sacramento',
    dmaId: '862',
    cities: ['sacramento', 'stockton', 'modesto'],
    primaryCity: 'sacramento',
    coordinates: { lat: 38.5816, lng: -121.4944 },
    radius: 40
  },
  {
    id: '37',
    name: 'San Diego',
    dmaId: '825',
    cities: ['san-diego', 'chula-vista'],
    primaryCity: 'san-diego',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    radius: 35
  },
  {
    id: '38',
    name: 'Richmond',
    dmaId: '556',
    cities: ['richmond', 'norfolk', 'virginia-beach', 'chesapeake'],
    primaryCity: 'richmond',
    coordinates: { lat: 37.5407, lng: -77.4360 },
    radius: 40
  },
  {
    id: '41',
    name: 'San Jose',
    dmaId: '807',
    cities: ['san-jose'],
    primaryCity: 'san-jose',
    coordinates: { lat: 37.3382, lng: -121.8863 },
    radius: 30
  },
  {
    id: '44',
    name: 'Orlando',
    dmaId: '534',
    cities: ['orlando'],
    primaryCity: 'orlando',
    coordinates: { lat: 28.5383, lng: -81.3792 },
    radius: 35
  },
  {
    id: '45',
    name: 'St. Louis',
    dmaId: '609',
    cities: ['st-louis'],
    primaryCity: 'st-louis',
    coordinates: { lat: 38.6270, lng: -90.1994 },
    radius: 35
  },
  {
    id: '46',
    name: 'Tampa/St. Petersburg',
    dmaId: '539',
    cities: ['tampa', 'st-petersburg'],
    primaryCity: 'tampa',
    coordinates: { lat: 27.9506, lng: -82.4572 },
    radius: 35
  },
  {
    id: '48',
    name: 'Norfolk/Virginia Beach',
    dmaId: '544',
    cities: ['norfolk', 'virginia-beach', 'chesapeake'],
    primaryCity: 'virginia-beach',
    coordinates: { lat: 36.8529, lng: -75.9780 },
    radius: 35
  },
  {
    id: '49',
    name: 'Seattle',
    dmaId: '819',
    cities: ['seattle', 'tacoma', 'spokane'],
    primaryCity: 'seattle',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    radius: 45
  }
];

// Additional secondary markets and smaller cities
export const SECONDARY_MARKETS = [
  { id: '50', name: 'Austin', cities: ['austin'], coordinates: { lat: 30.2672, lng: -97.7431 } },
  { id: '52', name: 'Tucson', cities: ['tucson'], coordinates: { lat: 32.2226, lng: -110.9747 } },
  { id: '53', name: 'Honolulu', cities: ['honolulu'], coordinates: { lat: 21.3099, lng: -157.8581 } },
  { id: '54', name: 'Bakersfield', cities: ['bakersfield'], coordinates: { lat: 35.3733, lng: -119.0187 } },
  { id: '55', name: 'Fresno', cities: ['fresno'], coordinates: { lat: 36.7378, lng: -119.7871 } },
  { id: '56', name: 'El Paso', cities: ['el-paso'], coordinates: { lat: 31.7619, lng: -106.4850 } },
  { id: '57', name: 'Corpus Christi', cities: ['corpus-christi'], coordinates: { lat: 27.8006, lng: -97.3964 } },
  { id: '58', name: 'Wichita', cities: ['wichita'], coordinates: { lat: 37.6872, lng: -97.3301 } },
  { id: '59', name: 'San Antonio', cities: ['san-antonio', 'laredo'], coordinates: { lat: 29.4241, lng: -98.4936 } },
  { id: '60', name: 'Albuquerque', cities: ['albuquerque'], coordinates: { lat: 35.0844, lng: -106.6504 } },
  { id: '61', name: 'Omaha', cities: ['omaha', 'lincoln'], coordinates: { lat: 41.2565, lng: -95.9345 } },
  { id: '62', name: 'Lexington', cities: ['lexington'], coordinates: { lat: 38.0406, lng: -84.5037 } },
  { id: '63', name: 'Anchorage', cities: ['anchorage'], coordinates: { lat: 61.2181, lng: -149.9003 } },
  { id: '64', name: 'Lubbock', cities: ['lubbock'], coordinates: { lat: 33.5779, lng: -101.8552 } },
  { id: '65', name: 'Baton Rouge', cities: ['baton-rouge'], coordinates: { lat: 30.4515, lng: -91.1871 } },
  { id: '66', name: 'Boise', cities: ['boise'], coordinates: { lat: 43.6150, lng: -116.2023 } },
  { id: '67', name: 'Birmingham', cities: ['birmingham'], coordinates: { lat: 33.5186, lng: -86.8104 } },
  { id: '68', name: 'Des Moines', cities: ['des-moines'], coordinates: { lat: 41.5868, lng: -93.6250 } }
];

// Utility functions for market mapping
export function getMarketForCity(cityId: string): TicketmasterMarket | null {
  return TICKETMASTER_MARKETS.find(market => 
    market.cities.includes(cityId)
  ) || null;
}

export function getMarketById(marketId: string): TicketmasterMarket | null {
  return TICKETMASTER_MARKETS.find(market => market.id === marketId) || null;
}

export function getAllMarketIds(): string[] {
  return [...TICKETMASTER_MARKETS.map(m => m.id), ...SECONDARY_MARKETS.map(m => m.id)];
}

export function findNearestMarket(lat: number, lng: number): TicketmasterMarket | null {
  let nearestMarket = null;
  let shortestDistance = Infinity;

  for (const market of TICKETMASTER_MARKETS) {
    const distance = calculateMarketDistance(lat, lng, market.coordinates.lat, market.coordinates.lng);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestMarket = market;
    }
  }

  return nearestMarket;
}

function calculateMarketDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}