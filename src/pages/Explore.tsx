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
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { PillTabs } from '@/components/ui/PillTabs';

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
    <div className="min-h-screen overflow-y-auto">
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

      <PageContainer className="pb-24">
        <div className="px-0 md:px-2 space-y-8">
          {/* Enhanced Search Section */}
          <div className="bg-gradient-to-br from-lo-teal/5 to-blue-50/50 rounded-3xl p-6 shadow-lg border border-lo-teal/10">
            <SectionHeader 
              title="Discover" 
              subtitle="Events, places, and people near you" 
              variant="large"
              className="mb-4" 
            />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search places, events, or people..."
                className="h-14 w-full rounded-2xl bg-white pl-14 pr-4 text-sm shadow-md hover:shadow-lg focus:shadow-xl transition-shadow border-0"
              />
            </div>
          </div>

          <div className="mt-4">
            <PillTabs
              items={filters.map((f) => ({ key: f, label: f }))}
              value={activeFilter}
              onChange={setActiveFilter}
            />
          </div>

          <div className="mt-6 space-y-10">
            <section>
              <SectionHeader 
                title="Trending Events" 
                subtitle="Hand-picked happenings near you" 
                action={<Button variant="ghost" size="sm" className="text-xs font-medium text-lo-teal hover:text-lo-teal/80">View all</Button>} 
                className="mb-6"
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {highlightedEvents.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-slate-500 border-dashed">We’ll surface curated events once they’re available in your area.</Card>
                ) : (
                  highlightedEvents.map((event) => (
                    <Card
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      hover
                      className="group overflow-hidden border-0"
                    >
                      {/* Event Image/Gradient Header */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                        {event.media_url && (
                          <img 
                            src={event.media_url} 
                            alt={event.event_title}
                            className="h-full w-full object-cover mix-blend-overlay"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Live Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-500/50">
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            Live
                          </span>
                        </div>
                      </div>
                      
                      {/* Event Content */}
                      <div className="p-6 space-y-4">
                        <h3 className="font-bold text-lg line-clamp-2 text-slate-900">
                          {event.event_title || event.content || 'Upcoming Event'}
                        </h3>
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin className="h-4 w-4 mr-2 text-lo-teal flex-shrink-0" />
                          <span className="truncate">{event.location || 'Unknown location'}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            {event.event_start_date
                              ? format(new Date(event.event_start_date), 'MMM d, h:mm a')
                              : 'Anytime'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <section>
              <SectionHeader 
                title="Suggested Posts" 
                subtitle="A mix of public Los and highlights from friends" 
                action={<Button variant="ghost" size="sm" className="text-xs font-medium text-lo-teal hover:text-lo-teal/80">Refresh</Button>} 
                className="mb-6"
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {curatedMessages.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-slate-500 border-dashed">No posts match your filters yet. Try a different category.</Card>
                ) : (
                  curatedMessages.map((message) => (
                    <Card
                      key={message.id}
                      onClick={() => handleMessageClick(message.id)}
                      hover
                      className="border-0"
                    >
                      <div className="p-6 space-y-4">
                        <p className="line-clamp-3 text-sm text-slate-700 leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-lo-teal" />
                            <span>{message.location || 'Somewhere nearby'}</span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {format(new Date(message.timestamp), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <Card variant="elevated" className="overflow-hidden border-lo-teal/20">
              <div className="bg-gradient-to-r from-lo-teal/10 to-blue-50/50 px-6 py-5 border-b border-lo-teal/20">
                <SectionHeader
                  title="Interactive Map"
                  subtitle="Explore nearby events and posts"
                  action={
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setActiveFilter('Nearby')}
                      className="shadow-sm"
                    >
                      Reset view
                    </Button>
                  }
                />
              </div>
              <div className="h-[500px]">
                <TabbedMapViewList
                  messages={filteredMessages}
                  events={events}
                  onMessageClick={handleMessageClick}
                  onEventClick={handleEventClick}
                  selectedMessage={selectedMessage}
                />
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>

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