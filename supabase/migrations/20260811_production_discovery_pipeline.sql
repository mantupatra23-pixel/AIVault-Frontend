-- Migration: Production-Safe Affiliate Discovery Pipeline Schema

-- 1. Create affiliate_settings table for network publisher credentials
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name TEXT NOT NULL UNIQUE, -- Impact, PartnerStack, CJ Affiliate, ShareASale, Rakuten
    publisher_id TEXT,
    api_key_encrypted TEXT,
    tracking_default TEXT DEFAULT 'aivault',
    is_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create affiliate_candidates table for discovery queue
CREATE TABLE IF NOT EXISTS public.affiliate_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_slug TEXT NOT NULL,
    official_url TEXT,
    network TEXT NOT NULL,
    program_name TEXT,
    destination_url TEXT,
    candidate_url TEXT NOT NULL,
    source TEXT DEFAULT 'Automated Discovery',
    confidence INTEGER DEFAULT 85,
    status TEXT DEFAULT 'PENDING_REVIEW', -- CANDIDATE_FOUND, VERIFICATION_REQUIRED, PENDING_REVIEW, APPROVED, REJECTED
    discovered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMPTZ,
    CONSTRAINT unique_tool_candidate_url UNIQUE (tool_id, candidate_url)
);

-- 3. Create affiliate_links table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
    network_name TEXT DEFAULT 'Direct Partner',
    program_name TEXT,
    affiliate_url TEXT,
    status TEXT DEFAULT 'DISCOVERY_REQUIRED', -- DISCOVERY_REQUIRED, SEARCHING, CANDIDATE_FOUND, VERIFICATION_REQUIRED, VERIFIED, ACTIVE, NETWORK_CREDENTIAL_REQUIRED, NO_PROGRAM, REJECTED
    validation_status TEXT DEFAULT 'UNKNOWN',
    last_validated_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tool_affiliate_link UNIQUE (tool_id)
);

-- 4. Create affiliate_clicks table for click tracking
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
    visitor_hash TEXT,
    referrer TEXT,
    landing_page TEXT,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aff_candidates_status ON public.affiliate_candidates(status);
CREATE INDEX IF NOT EXISTS idx_aff_candidates_tool_id ON public.affiliate_candidates(tool_id);
CREATE INDEX IF NOT EXISTS idx_aff_links_status ON public.affiliate_links(status);

-- RLS
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert clicks" ON public.affiliate_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write settings" ON public.affiliate_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write candidates" ON public.affiliate_candidates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write links" ON public.affiliate_links FOR ALL TO authenticated USING (true);
