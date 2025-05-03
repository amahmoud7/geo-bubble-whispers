
import React from 'react';

interface MessageCardContentProps {
  content: string;
  mediaUrl?: string;
}

const MessageCardContent: React.FC<MessageCardContentProps> = ({
  content,
  mediaUrl
}) => {
  return (
    <div className="p-4 pt-3">
      <p className="mb-2">{content}</p>
      {mediaUrl && (
        <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100">
          <img
            src={mediaUrl}
            alt="Message media"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default MessageCardContent;
