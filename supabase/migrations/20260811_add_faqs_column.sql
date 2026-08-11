-- Migration: Add missing faqs JSONB column to ai_tools
ALTER TABLE public.ai_tools 
ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;

-- Re-index slug for performant lookup
CREATE INDEX IF NOT EXISTS idx_ai_tools_slug ON public.ai_tools(slug);
