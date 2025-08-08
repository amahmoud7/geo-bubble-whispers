import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, Clock, DollarSign, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventMessage {
  id: string;
  content: string;
  media_url?: string;
  location?: string;
  lat?: number;
  lng?: number;
  event_source: string;
  external_event_id: string;
  event_url?: string;
  event_title: string;
  event_venue?: string;
  event_start_date: string;
  event_price_min?: number;
  event_price_max?: number;
  created_at: string;
}

interface EventMessageCardProps {
  message: EventMessage;
  onClick?: () => void;
}

const EventMessageCard: React.FC<EventMessageCardProps> = ({
  message,
  onClick
}) => {
  const eventDate = new Date(message.event_start_date);
  const isStartingSoon = eventDate.getTime() - Date.now() < 2 * 60 * 60 * 1000; // Within 2 hours

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleTicketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.event_url) {
      window.open(message.event_url, '_blank');
    }
  };

  return (
    <Card 
      className={`
        w-full cursor-pointer transition-all duration-200 hover:shadow-lg
        border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50
        hover:from-amber-100 hover:to-yellow-100
        ${isStartingSoon ? 'animate-pulse border-amber-400' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Event Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary" 
            className="bg-amber-200 text-amber-800 hover:bg-amber-300 flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            {message.event_source.toUpperCase()} EVENT
          </Badge>
          {isStartingSoon && (
            <Badge variant="destructive" className="animate-pulse">
              STARTING SOON
            </Badge>
          )}
        </div>

        {/* Event Image */}
        {message.media_url && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img 
              src={message.media_url} 
              alt={message.event_title}
              className="w-full h-40 object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* Event Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {message.event_title}
        </h3>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {/* Venue & Location */}
          {message.event_venue && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span className="font-medium">{message.event_venue}</span>
            </div>
          )}

          {/* Event Time */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{formatEventTime(message.event_start_date)}</span>
            <span className="text-xs text-gray-500">
              ({formatDistanceToNow(eventDate, { addSuffix: true })})
            </span>
          </div>

          {/* Price Range */}
          {message.event_price_min && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span className="font-medium">
                From ${message.event_price_min}
                {message.event_price_max && message.event_price_max !== message.event_price_min && 
                  ` - $${message.event_price_max}`
                }
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTicketClick}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Get Tickets
          </Button>
          {onClick && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Details
            </Button>
          )}
        </div>

        {/* Event Description Preview */}
        {message.content && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-sm text-gray-600 line-clamp-2">
              {message.content.replace(/[🎫✨🎵🎟️💰🕐📍#]/g, '').trim()}
            </p>
          </div>
        )}

        {/* Gold Accent Line */}
        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-400 to-yellow-600 rounded-l-lg"></div>
      </CardContent>
    </Card>
  );
};

export default EventMessageCard;