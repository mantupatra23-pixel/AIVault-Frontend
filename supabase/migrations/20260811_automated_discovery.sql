-- Migration: Automated Affiliate Discovery & Candidates Schema

-- 1. Ensure ai_tools has required status & tracking columns
ALTER TABLE public.ai_tools
ADD COLUMN IF NOT EXISTS affiliate_status TEXT DEFAULT 'DISCOVERY_REQUIRED',
ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
ADD COLUMN IF NOT EXISTS affiliate_program_name TEXT,
ADD COLUMN IF NOT EXISTS affiliate_commission_details TEXT,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;

-- 2. Create affiliate_programs reference directory
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    merchant_domain TEXT NOT NULL UNIQUE,
    affiliate_url_template TEXT NOT NULL,
    default_commission TEXT,
    cookie_duration_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create affiliate_candidates queue table
CREATE TABLE IF NOT EXISTS public.affiliate_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_slug TEXT NOT NULL,
    official_url TEXT,
    affiliate_network TEXT DEFAULT 'Direct Partner',
    program_name TEXT,
    candidate_url TEXT NOT NULL,
    commission_details TEXT DEFAULT 'Standard Tier',
    cookie_duration INTEGER DEFAULT 30,
    confidence_score INTEGER DEFAULT 85, -- 0-100 score
    status TEXT DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tool_candidate UNIQUE (tool_id, candidate_url)
);

-- Indexes for Admin Discovery Queries
CREATE INDEX IF NOT EXISTS idx_aff_candidates_status ON public.affiliate_candidates(status);
CREATE INDEX IF NOT EXISTS idx_aff_candidates_tool_id ON public.affiliate_candidates(tool_id);

-- RLS
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write candidates" ON public.affiliate_candidates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write programs" ON public.affiliate_programs FOR ALL TO authenticated USING (true);
