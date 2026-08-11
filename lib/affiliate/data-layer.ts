import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface JoinedToolRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  website_url: string | null;
  affiliate_url: string | null;
  affiliate_status: string;
  affiliate_network: string;
  clicks: number;
}

export async function getDashboardOverview() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      totalTools: 0,
      activeLinks: 0,
      discoveryRequired: 0,
      noProgramCount: 0,
      totalClicks: 0,
      tools: [],
    };
  }

  // 1. Query base directory index (ONLY verified columns)
  const { data: rawTools, count: tCount } = await supabase
    .from("ai_tools")
    .select("id, name, slug, category, website_url", { count: "exact" })
    .order("created_at", { ascending: false });

  const toolsList = rawTools || [];
  const totalTools = tCount || toolsList.length;

  // 2. Query affiliate_links relational data
  const { data: rawLinks } = await supabase
    .from("affiliate_links")
    .select("tool_id, affiliate_url, status, network_name");

  const linksMap = new Map<string, { affiliate_url: string | null; status: string; network_name: string }>();
  if (rawLinks) {
    rawLinks.forEach((l) => {
      linksMap.set(l.tool_id, {
        affiliate_url: l.affiliate_url,
        status: l.status || "NO_LINK",
        network_name: l.network_name || "Direct",
      });
    });
  }

  // 3. Query outbound telemetry clicks
  const { data: rawClicks, count: cCount } = await supabase
    .from("affiliate_clicks")
    .select("tool_id", { count: "exact" });

  const clickMap = new Map<string, number>();
  if (rawClicks) {
    rawClicks.forEach((c) => {
      if (c.tool_id) {
        clickMap.set(c.tool_id, (clickMap.get(c.tool_id) || 0) + 1);
      }
    });
  }

  let activeLinks = 0;
  let noProgramCount = 0;

  const joinedTools: JoinedToolRow[] = toolsList.map((tool) => {
    const aff = linksMap.get(tool.id);
    const status = aff?.status || (aff?.affiliate_url ? "ACTIVE" : "DISCOVERY_REQUIRED");

    if (status === "ACTIVE") activeLinks++;
    if (status === "NO_AFFILIATE_PROGRAM") noProgramCount++;

    return {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      category: tool.category || "Software",
      website_url: tool.website_url,
      affiliate_url: aff?.affiliate_url || null,
      affiliate_status: status,
      affiliate_network: aff?.network_name || "Direct",
      clicks: clickMap.get(tool.id) || 0,
    };
  });

  const discoveryRequired = Math.max(0, totalTools - activeLinks - noProgramCount);

  return {
    totalTools,
    activeLinks,
    discoveryRequired,
    noProgramCount,
    totalClicks: cCount || 0,
    tools: joinedTools,
  };
}
