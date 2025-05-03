
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const hasComments = comments.length > 0;
  
  return (
    <div className="p-4 pt-0">
      {/* Comments list with scroll area */}
      {hasComments && (
        <div className="mt-4 border-t pt-3">
          <ScrollArea className="max-h-[240px]">
            <CommentsList comments={comments} />
          </ScrollArea>
        </div>
      )}
      
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
