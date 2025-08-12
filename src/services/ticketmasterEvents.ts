import { supabase } from '@/integrations/supabase/client';

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  dates: {
    start: {
      dateTime: string;
      localDate: string;
      localTime: string;
    };
    end?: {
      dateTime: string;
    };
  };
  classifications: Array<{
    genre: { name: string };
    segment: { name: string };
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  _embedded: {
    venues: Array<{
      name: string;
      address: {
        line1: string;
        line2?: string;
      };
      city: { name: string };
      state: { name: string; stateCode: string };
      postalCode: string;
      location: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  info?: string;
  pleaseNote?: string;
}

export interface EventLoMessage {
  content: string;
  media_url?: string;
  is_public: boolean;
  location: string;
  lat: number;
  lng: number;
  message_type: 'event';
  event_source: 'ticketmaster';
  external_event_id: string;
  event_url: string;
  event_title: string;
  event_venue: string;
  event_start_date: string;
  event_end_date?: string;
  event_price_min?: number;
  event_price_max?: number;
  expires_at: string;
  user_id: null;
}

class TicketmasterEventsService {
  private isPolling = false;
  private pollInterval: number | null = null;
  private lastFetchTime = 0;
  private readonly POLL_INTERVAL = 30000; // 30 seconds
  private readonly RATE_LIMIT_DELAY = 5000; // 5 seconds between API calls

  /**
   * Start real-time polling for Ticketmaster events
   */
  async startRealTimeSync(): Promise<{ success: boolean; message: string; eventsCount?: number }> {
    if (this.isPolling) {
      return { success: false, message: 'Real-time sync is already running' };
    }

    try {
      // Initial fetch
      const initialResult = await this.fetchAndSyncEvents();
      
      // Start polling
      this.isPolling = true;
      this.pollInterval = window.setInterval(async () => {
        if (this.isPolling) {
          await this.fetchAndSyncEvents();
        }
      }, this.POLL_INTERVAL);

      return {
        success: true,
        message: `Real-time sync started. Found ${initialResult.eventsCount} events.`,
        eventsCount: initialResult.eventsCount
      };
    } catch (error) {
      console.error('Failed to start real-time sync:', error);
      return {
        success: false,
        message: `Failed to start sync: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Stop real-time polling
   */
  stopRealTimeSync(): void {
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Fetch events from Ticketmaster and sync to database
   */
  private async fetchAndSyncEvents(): Promise<{ eventsCount: number }> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastFetchTime < this.RATE_LIMIT_DELAY) {
      console.log('Rate limited, skipping fetch');
      return { eventsCount: 0 };
    }
    this.lastFetchTime = now;

    try {
      console.log('🎫 Fetching Ticketmaster events...');
      
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: { 
          source: 'ticketmaster',
          location: 'los-angeles',
          radius: 25,
          timeframe: '24h'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('✅ Events synced:', data);
      return { eventsCount: data?.newEvents || 0 };
    } catch (error) {
      console.error('❌ Error syncing events:', error);
      throw error;
    }
  }

  /**
   * Convert Ticketmaster event to Lo message format
   */
  static convertEventToLoMessage(event: TicketmasterEvent): EventLoMessage {
    const venue = event._embedded?.venues?.[0];
    const priceRange = event.priceRanges?.[0];
    const classification = event.classifications?.[0];

    // Format event date/time
    const startDateTime = new Date(event.dates.start.dateTime);
    const timeString = startDateTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create rich Lo message content
    const content = this.generateEventContent(event, venue, timeString, classification, priceRange);

    return {
      content,
      media_url: event.images?.find(img => img.width >= 300)?.url || event.images?.[0]?.url,
      is_public: true,
      location: venue?.name || 'Unknown Venue',
      lat: parseFloat(venue?.location?.latitude || '0'),
      lng: parseFloat(venue?.location?.longitude || '0'),
      message_type: 'event',
      event_source: 'ticketmaster',
      external_event_id: event.id,
      event_url: event.url,
      event_title: event.name,
      event_venue: venue?.name || 'Unknown Venue',
      event_start_date: event.dates.start.dateTime,
      event_end_date: event.dates.end?.dateTime,
      event_price_min: priceRange?.min,
      event_price_max: priceRange?.max,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      user_id: null
    };
  }

  /**
   * Generate rich content for event Lo message
   */
  private static generateEventContent(
    event: TicketmasterEvent, 
    venue: any, 
    timeString: string, 
    classification: any, 
    priceRange: any
  ): string {
    const emoji = this.getEventEmoji(classification?.segment?.name || classification?.genre?.name);
    
    let content = `${emoji} ${event.name}\n\n`;
    
    // Venue information
    if (venue) {
      content += `📍 ${venue.name}\n`;
      if (venue.address) {
        const address = `${venue.address.line1}${venue.address.line2 ? ', ' + venue.address.line2 : ''}, ${venue.city.name}, ${venue.state.stateCode}`;
        content += `${address}\n\n`;
      }
    }
    
    // Date and time
    content += `🕐 ${timeString}\n\n`;
    
    // Genre and classification
    if (classification?.genre?.name || classification?.segment?.name) {
      content += `🎵 ${classification.genre?.name || ''}${classification.segment?.name && classification.genre?.name ? ' • ' : ''}${classification.segment?.name || ''}\n\n`;
    }
    
    // Description
    if (event.info || event.pleaseNote) {
      const description = event.info || event.pleaseNote || '';
      content += `${description.slice(0, 150)}${description.length > 150 ? '...' : ''}\n\n`;
    }
    
    // Pricing
    if (priceRange) {
      content += `💰 From $${priceRange.min}${priceRange.max && priceRange.max !== priceRange.min ? ` - $${priceRange.max}` : ''}\n\n`;
    }
    
    content += `🎟️ Get tickets →\n\n`;
    content += `#Events #LA #Ticketmaster #Live`;
    
    return content;
  }

  /**
   * Get appropriate emoji for event type
   */
  private static getEventEmoji(category?: string): string {
    if (!category) return '🎫';
    
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('music') || lowerCategory.includes('concert')) return '🎵';
    if (lowerCategory.includes('sport')) return '🏟️';
    if (lowerCategory.includes('theater') || lowerCategory.includes('arts')) return '🎭';
    if (lowerCategory.includes('comedy')) return '😂';
    if (lowerCategory.includes('family')) return '👨‍👩‍👧‍👦';
    
    return '🎫';
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): { isActive: boolean; interval: number } {
    return {
      isActive: this.isPolling,
      interval: this.POLL_INTERVAL
    };
  }
}

export const ticketmasterService = new TicketmasterEventsService();