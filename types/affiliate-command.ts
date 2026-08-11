export type AffiliateStatus =
  | "NO_LINK"
  | "CONFIGURED"
  | "ACTIVE"
  | "PAUSED"
  | "BROKEN"
  | "PENDING_REVIEW";

export type ValidationStatus = "VALID" | "INVALID" | "TIMEOUT" | "BLOCKED" | "UNKNOWN";

export type CommissionType = "Percentage" | "Fixed" | "CPA" | "CPL" | "Revenue Share" | "Unknown";

export interface AffiliateLinkRecord {
  id: string;
  tool_id: string;
  network_name: string;
  program_name?: string | null;
  affiliate_url?: string | null;
  official_url?: string | null;
  affiliate_id?: string | null;
  tracking_id?: string | null;
  commission_type: CommissionType;
  commission_rate?: number | null;
  cookie_duration_days?: number | null;
  currency: string;
  notes?: string | null;
  status: AffiliateStatus;
  validation_status: ValidationStatus;
  last_validated_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ControlHubToolRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  official_url: string | null;
  affiliate_url: string | null;
  affiliate_status: AffiliateStatus;
  affiliate_network: string;
  link_id?: string | null;
  clicks: number;
  unique_clicks: number;
  conversions: number;
  commission_confirmed: number | null;
  commission_pending: number | null;
  last_updated?: string | null;
  traffic_tier?: number;
}

export interface CommandCenterOverview {
  totalTools: number;
  affiliateConfigured: number;
  missingAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  uniqueClicks: number;
  totalConversions: number;
  confirmedCommission: number | null;
  pendingCommission: number | null;
}
