-- Migration: Affiliate Settings, Candidates, and Discovery Pipeline

-- 1. Ensure ai_tools has required discovery & status fields
ALTER TABLE public.ai_tools
ADD COLUMN IF NOT EXISTS affiliate_status TEXT DEFAULT 'DISCOVERY_REQUIRED',
ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
ADD COLUMN IF NOT EXISTS affiliate_program_name TEXT,
ADD COLUMN IF NOT EXISTS affiliate_id_param TEXT,
ADD COLUMN IF NOT EXISTS tracking_id_param TEXT,
ADD COLUMN IF NOT EXISTS commission_type TEXT,
ADD COLUMN IF NOT EXISTS commission_rate TEXT,
ADD COLUMN IF NOT EXISTS cookie_duration_days INTEGER,
ADD COLUMN IF NOT EXISTS evidence_url TEXT,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;

-- 2. Create affiliate_settings table for secure server-side credentials
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name TEXT NOT NULL UNIQUE,
    publisher_id TEXT,
    api_key_encrypted TEXT,
    tracking_default TEXT DEFAULT 'aivault',
    is_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create affiliate_candidates table
CREATE TABLE IF NOT EXISTS public.affiliate_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_slug TEXT NOT NULL,
    official_url TEXT,
    network TEXT DEFAULT 'Direct Partner',
    program_name TEXT,
    candidate_url TEXT NOT NULL,
    evidence_url TEXT,
    commission_type TEXT DEFAULT 'Unknown',
    commission_rate TEXT,
    cookie_duration_days INTEGER DEFAULT 30,
    confidence INTEGER DEFAULT 80,
    status TEXT DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tool_candidate_url UNIQUE (tool_id, candidate_url)
);

-- Indexes for performant admin reporting
CREATE INDEX IF NOT EXISTS idx_aff_candidates_status ON public.affiliate_candidates(status);
CREATE INDEX IF NOT EXISTS idx_aff_candidates_tool_id ON public.affiliate_candidates(tool_id);

-- RLS
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write settings" ON public.affiliate_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write candidates" ON public.affiliate_candidates FOR ALL TO authenticated USING (true);
