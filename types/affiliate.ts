export type AffiliateStatus =
  | "NO_PROGRAM"
  | "PROGRAM_FOUND"
  | "APPLICATION_PENDING"
  | "ACTIVE"
  | "LINK_INVALID"
  | "LINK_EXPIRED"
  | "DISCONNECTED";

export type NotificationType =
  | "NEW_AFFILIATE_OPPORTUNITY"
  | "AFFILIATE_CONNECTED"
  | "AFFILIATE_LINK_UPDATED"
  | "AFFILIATE_LINK_INVALID"
  | "AFFILIATE_CONVERSION"
  | "COMMISSION_APPROVED"
  | "PAYOUT_RECEIVED"
  | "SYNC_ERROR";

export interface AffiliateOpportunity {
  id: string;
  tool_id: string;
  slug: string;
  tool_name: string;
  affiliate_program_name?: string | null;
  affiliate_network?: string | null;
  signup_url?: string | null;
  commission_details?: string | null;
  status: AffiliateStatus;
  created_at: string;
}

export interface AffiliateNotification {
  id: string;
  tool_id?: string | null;
  tool_name: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface AffiliateConnection {
  id: string;
  network_name: string;
  api_key_masked?: string | null;
  status: string;
  last_synced_at?: string | null;
}

export interface AffiliateMetrics {
  totalTools: number;
  affiliateActiveTools: number;
  opportunitiesFound: number;
  pendingApplications: number;
  brokenLinksCount: number;
  noProgramCount: number;
  totalOutboundClicks: number;
  totalConversions: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
}
