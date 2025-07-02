-- Fix the RLS policy for subscribers table to allow public insertions
DROP POLICY IF EXISTS "Allow public to insert subscribers" ON public.subscribers;

-- Create a new policy that properly allows public insertions
CREATE POLICY "Allow public to insert subscribers" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);

-- Also ensure the table has RLS enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;