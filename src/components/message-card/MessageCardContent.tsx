
import React from 'react';
import { getMessageType } from '../map/utils/messageTypeUtils';

interface MessageCardContentProps {
  content: string;
  mediaUrl?: string;
}

const MessageCardContent: React.FC<MessageCardContentProps> = ({
  content,
  mediaUrl
}) => {
  const messageType = getMessageType(mediaUrl, false); // Explicitly pass false for isLivestream

  return (
    <div className="p-4 pt-3">
      <p className="mb-2">{content}</p>
      {mediaUrl && (
        <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100">
          {messageType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-cover"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt="Message media"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MessageCardContent;
