-- Add columns to store GHL API response and error information
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ghl_response TEXT,
ADD COLUMN IF NOT EXISTS ghl_error TEXT;