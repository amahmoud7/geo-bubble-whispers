-- Create conversations table for DM threads
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants table (many-to-many relationship)
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  shared_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update the existing shares table to link to conversations
ALTER TABLE public.shares 
ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- RLS policies for conversation participants
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for direct messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();