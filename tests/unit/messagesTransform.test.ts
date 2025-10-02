import { describe, expect, it } from 'vitest';
import {
  transformMessage,
  transformEventToMessage,
} from '@/types/messages';

describe('message transformers', () => {
  it('transforms database message into map message', () => {
    const result = transformMessage(
      {
        id: '1',
        content: 'Hello',
        media_url: null,
        is_public: true,
        location: 'Downtown',
        lat: 40,
        lng: -73,
        user_id: 'user-1',
        created_at: '2024-09-25T00:00:00Z',
        expires_at: null,
        message_type: null,
        event_source: null,
        event_title: null,
        event_url: null,
        event_venue: null,
        event_start_date: null,
        event_price_min: null,
        event_price_max: null,
        likes: null,
      },
      'user-1'
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: '1',
        content: 'Hello',
        lat: 40,
        lng: -73,
        isEvent: false,
        liked: false,
        likes: 0,
        isPublic: true,
      })
    );
  });

  it('skips messages without coordinates', () => {
    const result = transformMessage(
      {
        id: 'missing',
        content: 'No coords',
        media_url: null,
        is_public: true,
        location: null,
        lat: null,
        lng: null,
        user_id: 'user',
        created_at: '2024-09-25T00:00:00Z',
        expires_at: null,
        message_type: null,
        event_source: null,
        event_title: null,
        event_url: null,
        event_venue: null,
        event_start_date: null,
        event_price_min: null,
        event_price_max: null,
        likes: null,
      },
      null
    );

    expect(result).toBeNull();
  });

  it('transforms event records into map messages', () => {
    const result = transformEventToMessage({
      id: 'event-1',
      title: 'Concert',
      description: 'Live music',
      image_url: null,
      venue_name: 'Arena',
      venue_address: '123 Main St',
      lat: 41,
      lng: -72,
      start_date: '2024-10-01T02:00:00Z',
      price_min: 20,
      price_max: 50,
      event_url: 'https://example.com',
      source: 'ticketmaster',
      created_at: '2024-09-01T00:00:00Z',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'event-event-1',
        isEvent: true,
        eventData: expect.objectContaining({ title: 'Concert' }),
      })
    );
  });
});
