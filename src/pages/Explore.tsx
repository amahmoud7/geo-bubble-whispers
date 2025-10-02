import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import TabbedMapViewList from '@/components/map/TabbedMapViewList';
import { useMessages } from '@/hooks/useMessages';
import { useEventMessages, type EventMessage } from '@/hooks/useEventMessages';
import EventDetailModal from '@/components/message/EventDetailModal';
import MessageDetail from '@/components/MessageDetail';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppTopBar from '@/components/layout/AppTopBar';
import { Chip } from '@/components/ui/chip';
import { format } from 'date-fns';
import type { MapMessage } from '@/types/messages';

interface ParsedEventContent {
  title?: string;
  venue?: string;
  address?: string;
  description?: string;
  startDateText?: string;
  priceMin?: number;
  priceMax?: number;
  url?: string;
}

const pickFirstValue = (...values: Array<string | null | undefined>): string | undefined => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
};

const parseEventContent = (content: string): ParsedEventContent => {
  if (!content) return {};

  const tokens = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length && !line.startsWith('#'));

  const parsed: ParsedEventContent = {};
  const descriptionParts: string[] = [];

  tokens.forEach((token) => {
    if (token.startsWith('🎫')) {
      parsed.title = token.replace(/^🎫\s*/, '').trim();
      return;
    }

    if (token.startsWith('📍')) {
      const venue = token.replace(/^📍\s*/, '').trim();
      if (!parsed.venue) parsed.venue = venue;
      return;
    }

    if (token.startsWith('📅')) {
      parsed.startDateText = token.replace(/^📅\s*/, '').trim();
      return;
    }

    if (token.startsWith('💰')) {
      const amounts = token.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/g);
      if (amounts?.length) {
        const numericValues = amounts
          .map((value) => Number(value.replace('$', '')))
          .filter((value) => !Number.isNaN(value))
          .sort((a, b) => a - b);

        if (numericValues.length) {
          parsed.priceMin = numericValues[0];
          parsed.priceMax = numericValues[numericValues.length - 1];
        }
      }
      return;
    }

    if (token.startsWith('🔗')) {
      parsed.url = token.replace(/^🔗\s*/, '').trim();
      return;
    }

    if (!parsed.address && /\d/.test(token)) {
      parsed.address = token;
    } else {
      descriptionParts.push(token);
    }
  });

  if (descriptionParts.length) {
    parsed.description = descriptionParts.join('\n\n');
  }

  return parsed;
};

const resolveEventDate = (message: MapMessage, parsed: ParsedEventContent): string => {
  if (message.eventData?.startDate) return message.eventData.startDate;
  if (parsed.startDateText) {
    const timestamp = new Date(parsed.startDateText);
    if (!Number.isNaN(timestamp.getTime())) {
      return timestamp.toISOString();
    }
  }
  return message.timestamp;
};

const mapMessageToEvent = (message: MapMessage): EventMessage => {
  const sanitizedContent = message.content.replace(/#Events/gi, '').trim();
  const parsed = parseEventContent(message.content);
  const description = parsed.description ?? sanitizedContent;
  const externalSource = message.eventData?.source;
  const source = externalSource ?? 'lo';
  const fallbackTitle = pickFirstValue(parsed.title, message.eventData?.title, sanitizedContent.split('\n').find(Boolean)) ?? 'Lo Event';
  const venue = pickFirstValue(message.eventData?.venue, parsed.venue, message.location);
  const location = pickFirstValue(parsed.address, message.location, venue);
  const eventUrl = pickFirstValue(message.eventData?.url, parsed.url);

  return {
    id: message.id,
    content: description,
    media_url: message.mediaUrl ?? undefined,
    location,
    lat: message.lat,
    lng: message.lng,
    event_source: source,
    external_event_id: externalSource ? `${externalSource}-${message.id}` : message.id,
    event_url: eventUrl,
    event_title: fallbackTitle,
    event_venue: venue,
    event_start_date: resolveEventDate(message, parsed),
    event_price_min: message.eventData?.priceMin ?? parsed.priceMin,
    event_price_max: message.eventData?.priceMax ?? parsed.priceMax,
    created_at: message.timestamp,
    expires_at: message.expiresAt ?? undefined,
  };
};

const Explore = () => {
  const navigate = useNavigate();
  const { filteredMessages } = useMessages();
  const { events } = useEventMessages();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventMessage | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('Nearby');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMessageClick = (id: string) => {
    // Find the message to determine if it's a user post or event
    const clickedMessage = filteredMessages.find(m => m.id === id);
    
    if (clickedMessage?.isEvent) {
      // Handle event posts - open event modal  
      console.log('🎫 EXPLORE: Opening event modal for:', clickedMessage);
      setSelectedEvent(mapMessageToEvent(clickedMessage));
      setSelectedMessage(null);
      setShowEventModal(true);
    } else {
      // Handle user posts - set selected message for detail view
      console.log('💬 EXPLORE: Opening message detail for:', clickedMessage);
      setSelectedMessage(id);
    }
  };

  const handleEventClick = (event: EventMessage) => {
    setSelectedEvent(event);
    setSelectedMessage(null);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const filters = ['Nearby', 'Trending', 'Events', 'Friends', 'Saved'];

  const highlightedEvents = useMemo(() => {
    if (!events?.length) return [];
    return events.slice(0, 6);
  }, [events]);

  const curatedMessages = useMemo(() => {
    const trimmed = filteredMessages
      .filter((message) =>
        searchQuery
          ? message.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.location?.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
      .slice(0, 8);
    return trimmed;
  }, [filteredMessages, searchQuery]);

  return (
    <div className="relative min-h-screen bg-slate-50 pb-24">
      <AppTopBar
        title="Explore"
        subtitle="discover"
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="px-6">
        {/* Search */}
        <div className="relative -mt-2">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search places, events, or people"
            className="h-12 w-full rounded-full bg-white pl-11 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Filters */}
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <Chip
              key={filter}
              selected={filter === activeFilter}
              onClick={() => setActiveFilter(filter)}
              className="whitespace-nowrap"
            >
              {filter}
            </Chip>
          ))}
        </div>
      </div>

        {/* Highlights */}
      <div className="mt-6 space-y-10 px-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Trending Events</h2>
              <p className="text-xs text-slate-500">Hand-picked happenings near you</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-medium">
              View all
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {highlightedEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                We’ll surface curated events once they’re available in your area.
              </div>
            ) : (
              highlightedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="group flex flex-col justify-between rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white">
                      Live
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                    </span>
                    <h3 className="mt-4 line-clamp-2 text-base font-semibold text-slate-900">
                      {event.event_title || event.content || 'Upcoming Event'}
                    </h3>
                    <p className="mt-2 flex items-center text-sm text-slate-500">
                      <MapPin className="mr-2 h-4 w-4 text-slate-400" />
                      {event.location || 'Unknown location'}
                    </p>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {event.event_start_date
                      ? format(new Date(event.event_start_date), 'MMM d, h:mm a')
                      : 'Anytime'}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Suggested Posts</h2>
              <p className="text-xs text-slate-500">A mix of public Los and highlights from friends</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-medium">
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {curatedMessages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No posts match your filters yet. Try a different category.
              </div>
            ) : (
              curatedMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="space-y-3 p-5 text-left">
                    <p className="line-clamp-3 text-sm text-slate-600">{message.content}</p>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <span>{message.location || 'Somewhere nearby'}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{format(new Date(message.timestamp), 'MMM d')}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Interactive Map</h2>
              <p className="text-xs text-slate-500">Tap a pin to open details instantly</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setActiveFilter('Nearby')}>
              Reset view
            </Button>
          </div>
          <div className="h-[420px]">
            <TabbedMapViewList
              messages={filteredMessages}
              events={events}
              onMessageClick={handleMessageClick}
              onEventClick={handleEventClick}
              selectedMessage={selectedMessage}
            />
          </div>
        </section>
      </div>

      {/* Message Detail Modal for user posts */}
      {selectedMessage && (() => {
        const foundMessage = filteredMessages.find(m => m.id === selectedMessage);
        return foundMessage && !foundMessage.isEvent ? (
          <MessageDetail 
            message={foundMessage}
            onClose={() => setSelectedMessage(null)}
          />
        ) : null;
      })()}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
      />
      <BottomNavigation />
    </div>
  );
};

export default Explore;