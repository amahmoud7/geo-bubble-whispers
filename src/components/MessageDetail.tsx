import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, MapPin, X, Heart, MessageSquare, Share2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import CommentsList from './CommentsList';

interface MessageDetailProps {
  message: {
    id: string;
    user: {
      name: string;
      avatar: string;
    };
    content: string;
    mediaUrl?: string;
    isPublic: boolean;
    timestamp: string;
    expiresAt: string;
    location: string;
  };
  onClose: () => void;
}

// Updated mock comments data with reply support
const mockComments = [
  {
    id: '1',
    user: {
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=alex',
    },
    content: 'This is such a beautiful place! 😍',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    likes: 5,
    replies: [
      {
        id: '1-reply-1',
        user: {
          name: 'Sam Williams',
          avatar: 'https://i.pravatar.cc/150?u=sam',
        },
        content: 'I agree! The lighting is perfect.',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
        likes: 2,
      }
    ]
  },
  {
    id: '2',
    user: {
      name: 'Sam Williams',
      avatar: 'https://i.pravatar.cc/150?u=sam',
    },
    content: 'I was there last week! The atmosphere is amazing.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    likes: 2,
    replies: []
  },
  {
    id: '3',
    user: {
      name: 'Taylor Chen',
      avatar: 'https://i.pravatar.cc/150?u=taylor',
    },
    content: 'Great shot! 📸 What camera did you use?',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    likes: 0,
    replies: []
  },
];

const MessageDetail: React.FC<MessageDetailProps> = ({ message, onClose }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 20));
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(mockComments);
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  // Calculate time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleExtend = () => {
    toast({
      title: "Duration Extended",
      description: "Message will be available for another 24 hours.",
    });
  };
  
  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    
    if (!liked) {
      toast({
        title: "Post liked",
        description: "You've liked this Lo",
      });
    }
  };

  const handleComment = () => {
    setShowCommentInput(!showCommentInput);
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      // Add the new comment to the list
      const newComment = {
        id: `comment-${Date.now()}`,
        user: {
          name: 'You', // In a real app, this would be the current user's name
          avatar: 'https://i.pravatar.cc/150?u=user', // In a real app, this would be the current user's avatar
        },
        content: comment.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      };
      
      setComments([newComment, ...comments]);
      setComment('');
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    }
  };

  const handleShare = () => {
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Lo from ${message.user.name}`,
        text: message.content,
        url: window.location.href,
      }).catch(err => {
        toast({
          title: "Shared",
          description: "Link copied to clipboard",
        });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/home?message=${message.id}`);
      toast({
        title: "Shared",
        description: "Link copied to clipboard",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto bg-white fade-in flex flex-col max-h-[90vh]">
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarImage 
                src={message.user.avatar} 
                alt={message.user.name.charAt(0)}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                {message.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">{message.user.name}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{message.location}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant={message.isPublic ? "default" : "secondary"}>
              {message.isPublic ? 'Public' : 'Followers'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 -mr-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 overflow-auto flex-grow">
          <p className="mb-3 text-base">{message.content}</p>
          {message.mediaUrl && (
            <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100 mb-3">
              <img
                src={message.mediaUrl}
                alt="Message media"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>Posted {formatTimestamp(message.timestamp)}</span>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{getTimeRemaining(message.expiresAt)} left</span>
            </div>
          </div>

          {/* Comments section */}
          <div className="mt-4 border-t pt-3">
            <CommentsList comments={comments} />
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex-col gap-4">
          <div className="flex justify-between w-full border-t border-b py-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 ${liked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              {likes > 0 && <span>{likes}</span>}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleComment}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          
          {/* Comment input field */}
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="You" />
                <AvatarFallback className="text-xs bg-purple-100 text-purple-500">
                  Y
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea 
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full resize-none py-2 min-h-0 h-10"
                  rows={1}
                />
                {comment.trim() && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-2 top-1 p-1 h-8 w-8"
                    onClick={handleSubmitComment}
                  >
                    <Send className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <Button onClick={handleExtend} variant="outline" className="w-full">
            Extend for 24 More Hours
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MessageDetail;
