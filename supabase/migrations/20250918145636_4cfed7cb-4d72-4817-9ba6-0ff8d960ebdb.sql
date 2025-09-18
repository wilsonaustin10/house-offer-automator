-- Create leads table for collecting lead information
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Property details
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    sms_consent BOOLEAN NOT NULL DEFAULT false,
    is_listed TEXT,
    condition TEXT,
    timeline TEXT,
    asking_price TEXT,
    -- Contact information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- CRM integration tracking
    zapier_sent BOOLEAN DEFAULT false,
    ghl_sent BOOLEAN DEFAULT false,
    zapier_sent_at TIMESTAMP WITH TIME ZONE,
    ghl_sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead collection
-- Allow anonymous users to insert leads (for public form submissions)
CREATE POLICY "Anyone can insert leads" 
ON public.leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Restrict viewing leads to authenticated users only (for admin access later)
CREATE POLICY "Only authenticated users can view leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (true);

-- Only authenticated users can update leads (for admin management)
CREATE POLICY "Only authenticated users can update leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (true);

-- Only authenticated users can delete leads (for admin management)
CREATE POLICY "Only authenticated users can delete leads" 
ON public.leads 
FOR DELETE 
TO authenticated
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
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on common queries
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_phone ON public.leads(phone);