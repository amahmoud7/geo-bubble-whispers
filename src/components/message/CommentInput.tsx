
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface CommentInputProps {
  comment: string;
  setComment: (comment: string) => void;
  onSubmit: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  comment,
  setComment,
  onSubmit
}) => {
  return (
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
            onClick={onSubmit}
          >
            <Send className="h-4 w-4 text-primary" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommentInput;
