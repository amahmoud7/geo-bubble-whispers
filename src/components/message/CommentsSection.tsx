
import React from 'react';
import CommentsList from '../CommentsList';
import CommentInput from './CommentInput';

interface CommentsSectionProps {
  comments: any[];
  comment: string;
  setComment: (comment: string) => void;
  onSubmitComment: () => void;
  showCommentInput: boolean;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  comment,
  setComment,
  onSubmitComment,
  showCommentInput
}) => {
  return (
    <div className="p-4 pt-0">
      {/* Comments list */}
      <div className="mt-4 border-t pt-3">
        <CommentsList comments={comments} />
      </div>
      
      {/* Comment input field */}
      {showCommentInput && (
        <div className="w-full space-y-2 mt-3">
          <CommentInput
            comment={comment}
            setComment={setComment}
            onSubmit={onSubmitComment}
          />
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
