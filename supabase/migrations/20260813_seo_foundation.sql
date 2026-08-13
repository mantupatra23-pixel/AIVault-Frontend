-- AI Vault SEO Foundation
-- NON-DESTRUCTIVE MIGRATION
-- Existing ai_tools data is preserved.

ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS best_for TEXT[],
  ADD COLUMN IF NOT EXISTS not_for TEXT[],
  ADD COLUMN IF NOT EXISTS use_cases TEXT[],
  ADD COLUMN IF NOT EXISTS platforms TEXT[],
  ADD COLUMN IF NOT EXISTS ai_verdict TEXT,
  ADD COLUMN IF NOT EXISTS data_confidence NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS website_status TEXT DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS popularity_score NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS growth_score NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trending_score NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness_score NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_vault_score NUMERIC(5,2);

-- Safe verification values
ALTER TABLE public.ai_tools
  DROP CONSTRAINT IF EXISTS ai_tools_verification_status_check;

ALTER TABLE public.ai_tools
  ADD CONSTRAINT ai_tools_verification_status_check
  CHECK (
    verification_status IN (
      'DISCOVERED',
      'ENRICHED',
      'PENDING',
      'VERIFIED',
      'REJECTED',
      'ARCHIVED'
    )
  );

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_slug
  ON public.ai_tools(slug);

CREATE INDEX IF NOT EXISTS idx_ai_tools_category
  ON public.ai_tools(category);

CREATE INDEX IF NOT EXISTS idx_ai_tools_verification_status
  ON public.ai_tools(verification_status);

CREATE INDEX IF NOT EXISTS idx_ai_tools_trending_score
  ON public.ai_tools(trending_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tools_popularity_score
  ON public.ai_tools(popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tools_growth_score
  ON public.ai_tools(growth_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tools_last_checked
  ON public.ai_tools(last_checked_at DESC);

-- Canonical URL generator
UPDATE public.ai_tools
SET canonical_url =
  'https://www.aivault.pp.ua/tools/' || slug
WHERE slug IS NOT NULL
  AND (canonical_url IS NULL OR canonical_url = '');

-- Safe defaults
UPDATE public.ai_tools
SET verification_status = 'PENDING'
WHERE verification_status IS NULL;

UPDATE public.ai_tools
SET last_checked_at = COALESCE(last_checked_at, NOW())
WHERE last_checked_at IS NULL;
