-- Create AI friends table to store AI configurations
CREATE TABLE public.ai_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  tone TEXT NOT NULL,
  age INTEGER NOT NULL,
  occupation TEXT NOT NULL,
  background TEXT NOT NULL,
  dream TEXT,
  family_info TEXT,
  story TEXT,
  daily_message_time TIME NOT NULL DEFAULT '18:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table to store chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_friend_id UUID NOT NULL REFERENCES public.ai_friends(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create memories table to store facts the AI should remember
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_friend_id UUID NOT NULL REFERENCES public.ai_friends(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('low', 'medium', 'high')),
  last_mentioned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no authentication for v1)
CREATE POLICY "Anyone can view AI friends"
  ON public.ai_friends FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create AI friends"
  ON public.ai_friends FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update AI friends"
  ON public.ai_friends FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete AI friends"
  ON public.ai_friends FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view conversations"
  ON public.conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view memories"
  ON public.memories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update memories"
  ON public.memories FOR UPDATE
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_friends_updated_at
  BEFORE UPDATE ON public.ai_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_conversations_ai_friend_id ON public.conversations(ai_friend_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX idx_memories_ai_friend_id ON public.memories(ai_friend_id);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;