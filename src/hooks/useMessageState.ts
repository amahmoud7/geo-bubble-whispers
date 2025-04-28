
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useMessageState = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [, forceUpdate] = useState({});

  const handleClose = () => {
    setSelectedMessage(null);
    setIsCreating(false);
    forceUpdate({});
  };

  return {
    selectedMessage,
    setSelectedMessage,
    isCreating,
    setIsCreating,
    handleClose,
  };
};
