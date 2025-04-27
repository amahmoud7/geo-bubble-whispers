
import React from 'react';

interface MessageBubbleProps {
  id: string;
  position: {
    x: number;
    y: number;
  };
  size?: number;
  color?: string;
  onClick: (id: string) => void;
  pulse?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  position,
  size = 10,
  color = 'rgba(147, 112, 219, 0.6)',
  onClick,
  pulse = false,
}) => {
  return (
    <div
      className={`bubble ${pulse ? 'pulse' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), ${color})`,
      }}
      onClick={() => onClick(id)}
    />
  );
};

export default MessageBubble;
