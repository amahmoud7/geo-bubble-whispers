
import React, { useState } from 'react';
import Comment from './Comment';
import { MessageSquareReply } from 'lucide-react';

interface CommentWithRepliesProps {
  comment: {
    id: string;
    user: {
      name: string;
      avatar: string;
    };
    content: string;
    timestamp: string;
    likes: number;
    replies?: any[]; // Using any[] for simplicity, but ideally should use proper type
  };
  likedComments: Record<string, boolean>;
  replyingTo: string | null;
  replyText: string;
  handleLike: (commentId: string, currentLikes: number) => void;
  handleReplyClick: (commentId: string) => void;
  handleSubmitReply: (commentId: string) => void;
  setReplyText: (text: string) => void;
  formatRelativeTime: (timestamp: string) => string;
}

const CommentWithReplies: React.FC<CommentWithRepliesProps> = ({
  comment,
  likedComments,
  replyingTo,
  replyText,
  handleLike,
  handleReplyClick,
  handleSubmitReply,
  setReplyText,
  formatRelativeTime
}) => {
  return (
    <div className="mb-4">
      <Comment 
        comment={comment}
        isLiked={!!likedComments[comment.id]}
        onLike={() => handleLike(comment.id, comment.likes)}
        formatRelativeTime={formatRelativeTime}
      />
      
      <div className="flex items-center mt-1 text-xs text-neutral-500 ml-10">
        <button 
          className="text-xs font-medium mr-3 hover:text-neutral-800"
          onClick={() => handleReplyClick(comment.id)}
        >
          Reply
        </button>
      </div>
      
      {/* Reply input field */}
      {replyingTo === comment.id && (
        <div className="flex items-center mt-2 ml-10">
          <input
            type="text"
            className="flex-1 text-xs border border-gray-300 rounded-full px-3 py-1.5"
            placeholder={`Reply to ${comment.user.name}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSubmitReply(comment.id);
            }}
          />
          <button 
            className="ml-2 text-xs font-medium text-blue-500 hover:text-blue-700"
            onClick={() => handleSubmitReply(comment.id)}
          >
            Post
          </button>
        </div>
      )}
      
      {/* Display replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start mb-2 group">
              <Comment
                comment={reply}
                isLiked={!!likedComments[reply.id]}
                onLike={() => handleLike(reply.id, reply.likes)}
                formatRelativeTime={formatRelativeTime}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentWithReplies;
