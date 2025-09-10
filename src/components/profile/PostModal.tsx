import React, { useState } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface PostModalProps {
  message: Message;
  messages?: Message[]; // All messages for navigation
  currentIndex?: number;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const PostModal: React.FC<PostModalProps> = ({ 
  message, 
  messages = [], 
  currentIndex = 0,
  onClose,
  onNavigate 
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Array<{id: string; text: string; user: string; time: string}>>([]);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, {
        id: Date.now().toString(),
        text: comment,
        user: user?.user_metadata?.full_name || 'You',
        time: 'Just now'
      }]);
      setComment('');
    }
  };

  const canNavigatePrev = messages.length > 0 && currentIndex > 0;
  const canNavigateNext = messages.length > 0 && currentIndex < messages.length - 1;

  const handleNavigatePrev = () => {
    if (canNavigatePrev && onNavigate) {
      onNavigate('prev');
    }
  };

  const handleNavigateNext = () => {
    if (canNavigateNext && onNavigate) {
      onNavigate('next');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation arrows */}
      {canNavigatePrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigatePrev();
          }}
          className="absolute left-4 text-white hover:text-gray-300 z-50 bg-black/50 rounded-full p-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      
      {canNavigateNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigateNext();
          }}
          className="absolute right-4 text-white hover:text-gray-300 z-50 bg-black/50 rounded-full p-2"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Modal content */}
      <div 
        className="bg-white rounded-lg overflow-hidden max-w-5xl w-full mx-4 max-h-[90vh] flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side - Image/Media */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[400px] relative">
          {message.media_url ? (
            <img 
              src={message.media_url} 
              alt={message.content || 'Post'} 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white p-8">
              <MapPin className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg text-center">{message.content}</p>
            </div>
          )}
        </div>

        {/* Right side - Post details */}
        <div className="w-96 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <img 
                  src={user?.user_metadata?.avatar_url || '/placeholder.svg'} 
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {user?.user_metadata?.full_name || 'Anonymous'}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{message.location || 'Unknown location'}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Comments section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Original post caption */}
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <img 
                  src={user?.user_metadata?.avatar_url || '/placeholder.svg'} 
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold mr-2">
                    {user?.user_metadata?.full_name || 'Anonymous'}
                  </span>
                  {message.content}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Comments */}
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <img 
                    src="/placeholder.svg" 
                    alt={comment.user}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{comment.user}</span>
                    {comment.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{comment.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t p-4 space-y-3">
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Send className="h-6 w-6" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSave}
                className={isSaved ? 'text-gray-900' : ''}
              >
                <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Likes count */}
            <p className="font-semibold text-sm">0 likes</p>

            {/* Time and expiry */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
              {message.expires_at && (
                <div className="flex items-center text-orange-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Expires {formatDistanceToNow(new Date(message.expires_at), { addSuffix: true })}</span>
                </div>
              )}
            </div>

            {/* Comment input */}
            <form onSubmit={handleComment} className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 border-0 focus:ring-0 px-0 text-sm"
              />
              <Button 
                type="submit"
                variant="ghost"
                size="sm"
                disabled={!comment.trim()}
                className="text-blue-500 hover:text-blue-600 disabled:text-gray-300"
              >
                Post
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;