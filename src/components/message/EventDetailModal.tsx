import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Share2,
  Navigation
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventMessage | null;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event
}) => {
  if (!event) return null;

  const eventDate = new Date(event.event_start_date);
  const isStartingSoon = eventDate.getTime() - Date.now() < 2 * 60 * 60 * 1000; // Within 2 hours

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      time: date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  const eventTime = formatEventTime(event.event_start_date);

  const handleTicketClick = () => {
    if (event.event_url) {
      window.open(event.event_url, '_blank');
    }
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_title,
          text: `Check out this event: ${event.event_title} at ${event.event_venue}`,
          url: event.event_url || window.location.href
        });
      } catch (error) {
        // Share was cancelled or failed
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `🎫 ${event.event_title}\n📍 ${event.event_venue}\n🕐 ${eventTime.full}\n🎟️ ${event.event_url}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Event details copied!",
        description: "Event information has been copied to your clipboard."
      });
    }
  };

  const handleDirectionsClick = () => {
    if (event.lat && event.lng) {
      const url = `https://maps.google.com/maps?daddr=${event.lat},${event.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 pr-8">
              {event.event_title}
            </DialogTitle>
            <Badge 
              variant="secondary" 
              className="bg-amber-200 text-amber-800 flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              {event.event_source.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          {event.media_url && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={event.media_url} 
                alt={event.event_title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Status Badge */}
          {isStartingSoon && (
            <div className="flex justify-center">
              <Badge 
                variant="destructive" 
                className="animate-pulse text-sm px-4 py-2"
              >
                🚨 STARTING SOON - Get tickets now!
              </Badge>
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">When</span>
              </div>
              <div className="ml-7">
                <p className="font-medium">{eventTime.date}</p>
                <p className="text-lg font-bold text-amber-700">{eventTime.time}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(eventDate, { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Venue & Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Where</span>
              </div>
              <div className="ml-7">
                <p className="font-medium">{event.event_venue}</p>
                {event.location && (
                  <p className="text-sm text-gray-600">{event.location}</p>
                )}
                {event.lat && event.lng && (
                  <Button
                    onClick={handleDirectionsClick}
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-amber-600 hover:text-amber-700"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Get Directions
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Price Information */}
          {event.event_price_min && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">Pricing</span>
              </div>
              <div className="ml-7">
                <p className="text-lg font-bold text-green-600">
                  From ${event.event_price_min}
                  {event.event_price_max && event.event_price_max !== event.event_price_min && 
                    ` - $${event.event_price_max}`
                  }
                </p>
                <p className="text-sm text-gray-500">Prices may vary by seating</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Event Description */}
          {event.content && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">About This Event</h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {event.content.replace(/[🎫✨🎵🎟️💰🕐📍#]/g, '').trim()}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleTicketClick}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-lg py-6"
              size="lg"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Get Tickets on {event.event_source === 'ticketmaster' ? 'Ticketmaster' : 'Eventbrite'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleShareClick}
                variant="outline"
                size="lg"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>
              * Ticket prices and availability are subject to change. 
              You will be redirected to {event.event_source === 'ticketmaster' ? 'Ticketmaster' : 'Eventbrite'} to complete your purchase.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;