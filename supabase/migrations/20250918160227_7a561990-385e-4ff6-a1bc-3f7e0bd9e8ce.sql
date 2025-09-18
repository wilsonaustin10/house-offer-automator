-- Drop the existing insert policy and recreate it to fix RLS issues
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- Create a new policy that properly allows anonymous lead insertions
CREATE POLICY "Allow anonymous lead insertion" 
ON public.leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);