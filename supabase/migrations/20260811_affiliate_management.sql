-- Migration: Affiliate Management Center Schema Upgrade
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_status_type') THEN
        CREATE TYPE public.affiliate_status_type AS ENUM (
            'NO_PROGRAM',
            'PROGRAM_FOUND',
            'APPLICATION_PENDING',
            'ACTIVE',
            'LINK_INVALID',
            'LINK_EXPIRED',
            'DISCONNECTED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE public.notification_type_enum AS ENUM (
            'NEW_AFFILIATE_OPPORTUNITY',
            'AFFILIATE_CONNECTED',
            'AFFILIATE_LINK_UPDATED',
            'AFFILIATE_LINK_INVALID',
            'AFFILIATE_CONVERSION',
            'COMMISSION_APPROVED',
            'PAYOUT_RECEIVED',
            'SYNC_ERROR'
        );
    END IF;
END $$;

-- 1. Ensure ai_tools has required affiliate management columns
ALTER TABLE public.ai_tools 
ADD COLUMN IF NOT EXISTS affiliate_status public.affiliate_status_type DEFAULT 'NO_PROGRAM',
ADD COLUMN IF NOT EXISTS affiliate_network VARCHAR(100),
ADD COLUMN IF NOT EXISTS affiliate_commission_info TEXT,
ADD COLUMN IF NOT EXISTS affiliate_last_checked_at TIMESTAMP WITH TIME ZONE;

-- 2. Create Affiliate Connections table
CREATE TABLE IF NOT EXISTS public.affiliate_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name VARCHAR(100) NOT NULL UNIQUE,
    api_key_masked VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Affiliate Opportunities table
CREATE TABLE IF NOT EXISTS public.affiliate_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    affiliate_program_name VARCHAR(255),
    affiliate_network VARCHAR(100),
    signup_url TEXT,
    commission_details TEXT,
    status public.affiliate_status_type DEFAULT 'PROGRAM_FOUND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Affiliate Admin Notifications table
CREATE TABLE IF NOT EXISTS public.affiliate_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    tool_name VARCHAR(255) NOT NULL,
    type public.notification_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Affiliate Conversions / Revenue Sync table
CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    slug VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, PAID, REFUNDED
    payout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Admin Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_affiliate_opps_tool_id ON public.affiliate_opportunities(tool_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifs_is_read ON public.affiliate_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_status ON public.affiliate_conversions(status);

-- Enable RLS
ALTER TABLE public.affiliate_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- Default Policies for authenticated admins / service role
CREATE POLICY "Allow authenticated read/write connections" ON public.affiliate_connections FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write opportunities" ON public.affiliate_opportunities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write notifications" ON public.affiliate_notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write conversions" ON public.affiliate_conversions FOR ALL TO authenticated USING (true);
