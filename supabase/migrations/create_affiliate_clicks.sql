-- Migration: Create affiliate_clicks table for tracking outbound clicks safely
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    slug VARCHAR(255) NOT NULL,
    destination_type VARCHAR(50) NOT NULL DEFAULT 'official',
    destination_url TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performant admin reporting
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_slug ON public.affiliate_clicks(slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_tool_id ON public.affiliate_clicks(tool_id);

-- Row Level Security (RLS)
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for outbound tracking
CREATE POLICY "Allow anon insert to affiliate_clicks" 
ON public.affiliate_clicks FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow read access to authenticated service role
CREATE POLICY "Allow read to service role" 
ON public.affiliate_clicks FOR SELECT 
TO authenticated 
USING (true);
