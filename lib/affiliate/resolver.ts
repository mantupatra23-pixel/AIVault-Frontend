import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface ResolvedToolUrl {
  outboundUrl: string;
  isAffiliate: boolean;
  buttonLabel: string;
}

export async function resolveToolOutboundUrl(
  toolId: string,
  slug: string,
  websiteUrl: string | null
): Promise<ResolvedToolUrl> {
  const supabase = getSupabaseClient();
  const defaultUrl = websiteUrl || `/tool/${slug}`;

  if (!supabase || !toolId) {
    return {
      outboundUrl: defaultUrl,
      isAffiliate: false,
      buttonLabel: "VISIT OFFICIAL PORTAL ↗",
    };
  }

  try {
    const { data: affLink } = await supabase
      .from("affiliate_links")
      .select("affiliate_url, status")
      .eq("tool_id", toolId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (affLink && affLink.affiliate_url && affLink.affiliate_url.trim() !== "") {
      return {
        outboundUrl: `/go/${slug}`,
        isAffiliate: true,
        buttonLabel: "VISIT OFFICIAL PORTAL ↗",
      };
    }
  } catch {
    // Non-blocking fallback to official website
  }

  return {
    outboundUrl: defaultUrl,
    isAffiliate: false,
    buttonLabel: "VISIT OFFICIAL PORTAL ↗",
  };
}
