// Mock event data for testing Ticketmaster integration
// This simulates what would come from the Ticketmaster API

export const mockEventMessages = [
  {
    id: 'tm-lakers-warriors-001',
    content: `🎫✨ Los Angeles Lakers vs Golden State Warriors

📍 Crypto.com Arena
1111 S Figueroa St, Los Angeles, CA 90015

🕐 Tonight 1:51 AM (2h)

🎵 Sports

💰 From $45 - $350

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Sports`,
    mediaUrl: null,
    isPublic: true,
    location: '1111 S Figueroa St, Los Angeles, CA 90015',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.043018,
      y: -118.267254
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Los Angeles Lakers vs Golden State Warriors',
      venue_name: 'Crypto.com Arena',
      venue_address: '1111 S Figueroa St, Los Angeles, CA 90015',
      start_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      price_min: 45,
      price_max: 350,
      event_url: 'https://www.ticketmaster.com/los-angeles-lakers-tickets/artist/805954',
      source: 'ticketmaster'
    }
  },
  {
    id: 'tm-billie-eilish-002',
    content: `🎫✨ Billie Eilish - Hit Me Hard and Soft Tour

📍 Hollywood Bowl
2301 N Highland Ave, Hollywood, CA 90068

🕐 Tonight 4:51 AM (5h)

🎵 Music

💰 From $89 - $250

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Music`,
    mediaUrl: null,
    isPublic: true,
    location: '2301 N Highland Ave, Hollywood, CA 90068',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.112222,
      y: -118.339167
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Billie Eilish - Hit Me Hard and Soft Tour',
      venue_name: 'Hollywood Bowl',
      venue_address: '2301 N Highland Ave, Hollywood, CA 90068',
      start_date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      price_min: 89,
      price_max: 250,
      event_url: 'https://www.ticketmaster.com/billie-eilish-tickets/artist/2714396',
      source: 'ticketmaster'
    }
  },
  {
    id: 'tm-comedy-laugh-003',
    content: `🎫✨ Comedy Night at The Laugh Factory

📍 The Laugh Factory
8001 Sunset Blvd, West Hollywood, CA 90046

🕐 Tonight 7:51 AM (8h)

🎵 Comedy

💰 From $25 - $65

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Comedy`,
    mediaUrl: null,
    isPublic: true,
    location: '8001 Sunset Blvd, West Hollywood, CA 90046',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.097778,
      y: -118.370556
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Comedy Night at The Laugh Factory',
      venue_name: 'The Laugh Factory',
      venue_address: '8001 Sunset Blvd, West Hollywood, CA 90046',
      start_date: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      price_min: 25,
      price_max: 65,
      event_url: 'https://www.ticketmaster.com/the-laugh-factory-tickets/venue/229396',
      source: 'ticketmaster'
    }
  },
  {
    id: 'tm-hamilton-004',
    content: `🎫✨ Hamilton - Musical

📍 Hollywood Pantages Theatre
6233 Hollywood Blvd, Hollywood, CA 90028

🕐 Tonight 9:51 AM (10h)

🎵 Theatre

💰 From $129 - $450

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Theatre`,
    mediaUrl: null,
    isPublic: true,
    location: '6233 Hollywood Blvd, Hollywood, CA 90028',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.101944,
      y: -118.324167
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Hamilton - Musical',
      venue_name: 'Hollywood Pantages Theatre',
      venue_address: '6233 Hollywood Blvd, Hollywood, CA 90028',
      start_date: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      price_min: 129,
      price_max: 450,
      event_url: 'https://www.ticketmaster.com/hamilton-los-angeles-tickets/artist/2098866',
      source: 'ticketmaster'
    }
  },
  {
    id: 'tm-galaxy-lafc-005',
    content: `🎫✨ LA Galaxy vs LAFC - El Tráfico

📍 BMO Stadium
3939 S Figueroa St, Los Angeles, CA 90037

🕐 Tonight 11:51 AM (12h)

🎵 Sports

💰 From $35 - $180

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Sports`,
    mediaUrl: null,
    isPublic: true,
    location: '3939 S Figueroa St, Los Angeles, CA 90037',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.012778,
      y: -118.285556
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'LA Galaxy vs LAFC - El Tráfico',
      venue_name: 'BMO Stadium',
      venue_address: '3939 S Figueroa St, Los Angeles, CA 90037',
      start_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      price_min: 35,
      price_max: 180,
      event_url: 'https://www.ticketmaster.com/la-galaxy-tickets/artist/805961',
      source: 'ticketmaster'
    }
  }
];

// Additional events for full demonstration
export const additionalMockEvents = [
  {
    id: 'tm-chappelle-006',
    content: `🎫✨ Dave Chappelle - Stand Up Comedy

📍 Microsoft Theater
777 Chick Hearn Ct, Los Angeles, CA 90015

🕐 Tonight 2:51 PM (15h)

🎵 Comedy

💰 From $75 - $300

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Comedy`,
    mediaUrl: null,
    isPublic: true,
    location: '777 Chick Hearn Ct, Los Angeles, CA 90015',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.043056,
      y: -118.267778
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Dave Chappelle - Stand Up Comedy',
      venue_name: 'Microsoft Theater',
      venue_address: '777 Chick Hearn Ct, Los Angeles, CA 90015',
      start_date: new Date(Date.now() + 15 * 60 * 60 * 1000).toISOString(),
      price_min: 75,
      price_max: 300,
      event_url: 'https://www.ticketmaster.com/dave-chappelle-tickets/artist/735227',
      source: 'ticketmaster'
    }
  },
  {
    id: 'tm-ariana-grande-008',
    content: `🎫✨ Ariana Grande - Eternal Sunshine Tour

📍 Kia Forum
3900 W Manchester Blvd, Inglewood, CA 90305

🕐 Tonight 7:51 PM (20h)

🎵 Music

💰 From $95 - $375

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Music`,
    mediaUrl: null,
    isPublic: true,
    location: '3900 W Manchester Blvd, Inglewood, CA 90305',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 33.958056,
      y: -118.341944
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Ariana Grande - Eternal Sunshine Tour',
      venue_name: 'Kia Forum',
      venue_address: '3900 W Manchester Blvd, Inglewood, CA 90305',
      start_date: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
      price_min: 95,
      price_max: 375,
      event_url: 'https://www.ticketmaster.com/ariana-grande-tickets/artist/1464968',
      source: 'ticketmaster'
    }
  },
  {
    id: 'tm-cirque-soleil-009',
    content: `🎫✨ Cirque du Soleil - ECHO

📍 Santa Monica Pier
200 Santa Monica Pier, Santa Monica, CA 90401

🕐 Tonight 9:51 PM (22h)

🎵 Family

💰 From $45 - $150

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Family`,
    mediaUrl: null,
    isPublic: true,
    location: '200 Santa Monica Pier, Santa Monica, CA 90401',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user: {
      name: 'Ticketmaster Events',
      avatar: 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
    },
    position: {
      x: 34.008889,
      y: -118.498056
    },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: 'Cirque du Soleil - ECHO',
      venue_name: 'Santa Monica Pier',
      venue_address: '200 Santa Monica Pier, Santa Monica, CA 90401',
      start_date: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      price_min: 45,
      price_max: 150,
      event_url: 'https://www.ticketmaster.com/cirque-du-soleil-tickets/artist/734547',
      source: 'ticketmaster'
    }
  }
];

// All events combined
export const allMockEventMessages = [...mockEventMessages, ...additionalMockEvents];