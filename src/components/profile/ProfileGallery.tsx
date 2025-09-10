import React from 'react';
import { Heart, MessageCircle, Play, MapPin, Clock } from 'lucide-react';
import { Message } from '@/types/database';

interface ProfileGalleryProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
  className?: string;
}

const ProfileGallery = ({ messages, onMessageClick, className = '' }: ProfileGalleryProps) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const getMediaThumbnail = (message: Message) => {
    if (message.media_url) {
      return message.media_url;
    }
    // Generate a placeholder based on location or content
    return `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=400&fit=crop&crop=center`;
  };

  const isVideoContent = (message: Message) => {
    return message.media_type === 'video' || message.media_type === 'live_stream';
  };

  if (!messages || messages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Share your location-based moments to see them here
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-1 md:gap-2 ${className}`}>
      {messages.map((message) => (
        <div
          key={message.id}
          className="relative aspect-square cursor-pointer group overflow-hidden"
          onClick={() => {
            console.log('🖼️ Gallery: Image clicked, calling onMessageClick');
            onMessageClick?.(message);
          }}
        >
          {/* Thumbnail image */}
          <img
            src={getMediaThumbnail(message)}
            alt={message.content || 'Post'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />

          {/* Video indicator */}
          {isVideoContent(message) && (
            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          )}

          {/* Expiry indicator */}
          {message.expires_at && new Date(message.expires_at) < new Date() && (
            <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
              <Clock className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Hover overlay with engagement stats */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center space-x-4 text-white text-sm font-medium">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4 fill-white" />
                <span>0</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>0</span>
              </div>
            </div>
          </div>

          {/* Location indicator */}
          {message.location && (
            <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-white" />
                <span className="text-xs text-white truncate max-w-20">
                  {message.location}
                </span>
              </div>
            </div>
          )}

          {/* Time stamp */}
          <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1">
            <span className="text-xs text-white">
              {formatTimeAgo(message.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileGallery;