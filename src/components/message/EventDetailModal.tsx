import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Share2,
  Navigation,
  Heart,
  BookmarkPlus,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Ticket,
  Camera,
  X
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
  isLoading?: boolean;
  relatedEvents?: EventMessage[];
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  isLoading = false,
  relatedEvents = []
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'directions' | 'related'>('details');
  
  if (!event && !isLoading) return null;

  const eventDate = event ? new Date(event.event_start_date) : new Date();
  const isStartingSoon = event && eventDate.getTime() - Date.now() < 2 * 60 * 60 * 1000; // Within 2 hours
  const isPast = event && eventDate.getTime() < Date.now();

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Event removed from saved" : "Event saved!",
      description: isSaved ? "Event removed from your saved list" : "You can find this in your saved events",
      duration: 2000,
    });
  };

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

  const eventTime = event ? formatEventTime(event.event_start_date) : null;

  const handleTicketClick = () => {
    if (event?.event_url) {
      window.open(event.event_url, '_blank');
      toast({
        title: "Redirecting to tickets",
        description: "Opening Ticketmaster in a new tab",
        duration: 2000,
      });
    }
  };

  const handleShareClick = async () => {
    if (!event) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_title,
          text: `Check out this event: ${event.event_title} at ${event.event_venue}`,
          url: event.event_url || window.location.href
        });
        toast({
          title: "Event shared!",
          description: "Thanks for sharing this event",
          duration: 2000,
        });
      } catch (error) {
        // Share was cancelled or failed - do nothing
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${event.event_title}\n📍 ${event.event_venue}\n🕐 ${eventTime?.full}\n🎟️ ${event.event_url}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Event details copied!",
        description: "Event information has been copied to your clipboard.",
        duration: 2000,
      });
    }
  };

  const handleDirectionsClick = () => {
    if (event?.lat && event?.lng) {
      const url = `https://maps.google.com/maps?daddr=${event.lat},${event.lng}`;
      window.open(url, '_blank');
      toast({
        title: "Opening directions",
        description: "Launching Google Maps with directions",
        duration: 2000,
      });
    }
  };

  const getCategoryBadgeColor = (source: string) => {
    return source === 'ticketmaster' 
      ? 'bg-blue-100 text-blue-800 border-blue-300' 
      : 'bg-green-100 text-green-800 border-green-300';
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden bg-white rounded-3xl">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : event ? (
          <div className="h-[95vh] flex flex-col">
            <div className="flex-1 overflow-y-auto overscroll-behavior-contain">
              <div className="relative">
              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white rounded-full w-10 h-10 p-0 shadow-lg"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Hero Section */}
              <div className="relative">
                {/* Event Image */}
                {event.media_url && !imageError ? (
                  <div className="relative h-80 lg:h-96 overflow-hidden">
                    <img
                      src={event.media_url}
                      alt={event.event_title}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isImageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setIsImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                    {!isImageLoaded && (
                      <Skeleton className="absolute inset-0" />
                    )}
                    
                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Hero Content */}
                    <div className="absolute bottom-6 left-6 right-16 text-white">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge 
                          variant="secondary" 
                          className={`${getCategoryBadgeColor(event.event_source)} border font-semibold backdrop-blur-sm`}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          {event.event_source.toUpperCase()}
                        </Badge>
                        {isStartingSoon && (
                          <Badge 
                            variant="destructive" 
                            className="bg-red-500/90 text-white animate-pulse backdrop-blur-sm"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            STARTING SOON
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="secondary" className="bg-gray-500/90 text-white backdrop-blur-sm">
                            PAST EVENT
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                        {event.event_title}
                      </h1>
                      <div className="flex items-center space-x-4 text-white/90">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{event.event_venue}</span>
                        </div>
                        {eventTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{eventTime.date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Fallback hero without image */
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-20"></div>
                    
                    <div className="relative">
                      <div className="flex items-center space-x-3 mb-4">
                        <Badge 
                          variant="secondary" 
                          className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          {event.event_source.toUpperCase()}
                        </Badge>
                        {isStartingSoon && (
                          <Badge 
                            variant="destructive" 
                            className="bg-red-500/90 text-white animate-pulse backdrop-blur-sm"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            STARTING SOON
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                        {event.event_title}
                      </h1>
                      <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-6 text-white/90">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5" />
                          <span className="font-medium">{event.event_venue}</span>
                        </div>
                        {eventTime && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <div>
                              <p className="font-medium">{eventTime.date}</p>
                              <p className="text-xl font-bold">{eventTime.time}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Action Bar */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleSave}
                      variant="ghost"
                      size="sm"
                      className={`rounded-full ${isSaved ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-700'}`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      onClick={handleShareClick}
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-gray-600 hover:text-gray-700"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {eventTime && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{formatDistanceToNow(eventDate, { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="px-6 py-6 space-y-8">
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Time & Date Card */}
                  {eventTime && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">When</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-xl text-blue-700">{eventTime.time}</p>
                        <p className="font-medium text-gray-900">{eventTime.date}</p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(eventDate, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Location Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Where</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{event.event_venue}</p>
                      {event.location && (
                        <p className="text-sm text-gray-600">{event.location}</p>
                      )}
                      {event.lat && event.lng && (
                        <Button
                          onClick={handleDirectionsClick}
                          variant="outline"
                          size="sm"
                          className="mt-3 rounded-xl border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Price Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Pricing</h3>
                    </div>
                    <div className="space-y-2">
                      {event.event_price_min ? (
                        <>
                          <p className="font-bold text-xl text-amber-700">
                            From ${event.event_price_min}
                            {event.event_price_max && event.event_price_max !== event.event_price_min && 
                              ` - $${event.event_price_max}`
                            }
                          </p>
                          <p className="text-sm text-gray-600">Prices may vary by seating</p>
                        </>
                      ) : (
                        <p className="text-gray-600">Check official site for pricing</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Description */}
                {event.content && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                      <Camera className="w-5 h-5 text-gray-600" />
                      <span>About This Event</span>
                    </h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {event.content.replace(/[🎫✨🎵🎟️💰🕐📍#]/g, '').trim()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Call to Action Section */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                  <div className="text-center space-y-4">
                    {!isPast ? (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">Ready to go?</h3>
                        <p className="text-gray-600">
                          Secure your spot at this amazing event. Tickets are available now!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={handleTicketClick}
                            disabled={isPast}
                            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                            size="lg"
                          >
                            <Ticket className="w-5 h-5 mr-2" />
                            Get Tickets on {event.event_source === 'ticketmaster' ? 'Ticketmaster' : 'Eventbrite'}
                          </Button>
                          
                          <Button
                            onClick={handleSave}
                            variant="outline"
                            size="lg"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-2xl px-6"
                          >
                            <BookmarkPlus className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-gray-700">This event has passed</p>
                        <p className="text-gray-600">Check out similar upcoming events</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Disclaimer */}
                <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="leading-relaxed">
                    <strong>Disclaimer:</strong> Ticket prices and availability are subject to change. 
                    You will be redirected to {event.event_source === 'ticketmaster' ? 'Ticketmaster' : 'Eventbrite'} to complete your purchase.
                    Event details are provided for informational purposes only.
                  </p>
                </div>

                {/* Related Events */}
                {relatedEvents.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                      <Star className="w-5 h-5 text-amber-600" />
                      <span>More Events You Might Like</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedEvents.slice(0, 4).map((relatedEvent) => (
                        <div
                          key={relatedEvent.id}
                          className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-200 hover:shadow-md"
                        >
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {relatedEvent.event_title}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{relatedEvent.event_venue}</span>
                            </p>
                            <p className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(relatedEvent.event_start_date).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;