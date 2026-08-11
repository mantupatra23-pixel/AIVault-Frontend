-- Migration: Affiliate Command Center Relational Architecture

-- 1. Create affiliate_links table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE CASCADE,
    network_name TEXT DEFAULT 'Direct',
    program_name TEXT,
    affiliate_url TEXT,
    official_url TEXT,
    affiliate_id TEXT,
    tracking_id TEXT,
    commission_type TEXT DEFAULT 'Unknown', -- Percentage, Fixed, CPA, CPL, RevShare, Unknown
    commission_rate NUMERIC,
    cookie_duration_days INTEGER,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT,
    status TEXT DEFAULT 'NO_LINK', -- NO_LINK, CONFIGURED, ACTIVE, PAUSED, BROKEN, PENDING_REVIEW
    validation_status TEXT DEFAULT 'UNKNOWN', -- VALID, INVALID, TIMEOUT, BLOCKED, UNKNOWN
    last_validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tool_affiliate_link UNIQUE (tool_id)
);

-- 2. Create affiliate_clicks table with unique visitor telemetry
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    visitor_hash TEXT,
    referrer TEXT,
    landing_page TEXT,
    device_type TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create affiliate_conversions table
CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    network_name TEXT,
    external_conversion_id TEXT,
    conversion_status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, REJECTED, PAID
    amount NUMERIC DEFAULT 0.00,
    commission NUMERIC DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    occurred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Admin Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_aff_links_tool_id ON public.affiliate_links(tool_id);
CREATE INDEX IF NOT EXISTS idx_aff_links_status ON public.affiliate_links(status);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_tool_id ON public.affiliate_clicks(tool_id);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_visitor_hash ON public.affiliate_clicks(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_clicked_at ON public.affiliate_clicks(clicked_at);

-- RLS
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert clicks" ON public.affiliate_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated full links" ON public.affiliate_links FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full conversions" ON public.affiliate_conversions FOR ALL TO authenticated USING (true);
