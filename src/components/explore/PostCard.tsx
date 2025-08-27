import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MapPin, 
  Clock, 
  Calendar,
  Globe,
  Users,
  Play,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostUser {
  name: string;
  avatar: string;
  username?: string;
}

interface EventData {
  title: string;
  venue: string;
  url: string;
  startDate: string;
  priceMin?: number;
  priceMax?: number;
  source: string;
}

interface PostCardProps {
  post: {
    id: string;
    content: string;
    mediaUrl?: string;
    timestamp: string;
    location: string;
    user: PostUser;
    isPublic: boolean;
    position?: {
      x: number;
      y: number;
    };
    liked?: boolean;
    likes?: number;
    isEvent?: boolean;
    eventData?: EventData;
  };
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onClick?: (postId: string) => void;
  showDistance?: boolean;
  distance?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onClick,
  showDistance,
  distance
}) => {
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(post.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(post.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(post.id);
  };

  const handleCardClick = () => {
    onClick?.(post.id);
  };

  const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  
  const getMediaType = (url?: string) => {
    if (!url) return null;
    const extension = url.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'video';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) return 'image';
    return null;
  };

  const mediaType = getMediaType(post.mediaUrl);

  return (
    <Card 
      className="border-0 border-b border-gray-100 rounded-none cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback className="bg-lo-teal text-white">
              {post.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {post.user.name}
              </h3>
              {post.user.username && (
                <span className="text-gray-500 text-sm truncate">
                  @{post.user.username}
                </span>
              )}
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-500 text-sm flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {timeAgo}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              {post.isEvent && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Event
                </Badge>
              )}
              <div className="flex items-center text-gray-500 text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{post.location}</span>
                {showDistance && distance && (
                  <span className="ml-1 text-lo-teal">· {distance}</span>
                )}
              </div>
              <div className="flex items-center ml-auto">
                {post.isPublic ? (
                  <Globe className="h-4 w-4 text-lo-teal" />
                ) : (
                  <Users className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Event Details */}
          {post.isEvent && post.eventData && (
            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900">
                    {post.eventData.title}
                  </h4>
                  <p className="text-purple-700 text-sm mt-1">
                    📍 {post.eventData.venue}
                  </p>
                  <p className="text-purple-600 text-sm mt-1">
                    📅 {new Date(post.eventData.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  {(post.eventData.priceMin || post.eventData.priceMax) && (
                    <p className="text-purple-600 text-sm mt-1">
                      💰 {post.eventData.priceMin ? `From $${post.eventData.priceMin}` : 'Price varies'}
                    </p>
                  )}
                </div>
                {post.eventData.url && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(post.eventData!.url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Tickets
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Media */}
          {post.mediaUrl && (
            <div className="mt-3 rounded-xl overflow-hidden bg-gray-100">
              {mediaType === 'image' && (
                <div className="relative">
                  {!isMediaLoaded && (
                    <div className="aspect-video bg-gray-200 animate-pulse flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className={`w-full max-h-96 object-cover transition-opacity duration-300 ${
                      isMediaLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                    onLoad={() => setIsMediaLoaded(true)}
                  />
                </div>
              )}
              {mediaType === 'video' && (
                <div className="relative aspect-video bg-black">
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-2">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              className={`hover:bg-red-50 hover:text-red-600 ${
                isLiked ? 'text-red-600' : 'text-gray-500'
              }`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600 text-gray-500"
              onClick={handleComment}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Reply</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-green-50 hover:text-green-600 text-gray-500"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span className="text-sm">Share</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`hover:bg-yellow-50 hover:text-yellow-600 ${
              isBookmarked ? 'text-yellow-600' : 'text-gray-500'
            }`}
            onClick={handleBookmark}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;