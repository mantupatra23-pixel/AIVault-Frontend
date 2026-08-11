import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Known affiliate networks/providers
const KNOWN_NETWORKS: { domain: string; name: string }[] = [
  { domain: "partnerstack.com", name: "PartnerStack" },
  { domain: "impact.com", name: "Impact" },
  { domain: "shareasale.com", name: "ShareASale" },
  { domain: "awin.com", name: "Awin" },
  { domain: "cj.com", name: "CJ Affiliate" },
  { domain: "commission-junction.com", name: "CJ Affiliate" },
  { domain: "rakutenadvertising.com", name: "Rakuten Advertising" },
  { domain: "rewardful.com", name: "Rewardful" },
  { domain: "firstpromoter.com", name: "FirstPromoter" },
  { domain: "tapfiliate.com", name: "Tapfiliate" },
  { domain: "tolt.io", name: "Tolt" },
  { domain: "everflow.io", name: "Everflow" },
  { domain: "refersion.com", name: "Refersion" },
  { domain: "uppromote.com", name: "UpPromote" },
  { domain: "goaffpro.com", name: "GoAffPro" },
  { domain: "leaddyno.com", name: "LeadDyno" },
];

const CANDIDATE_PATH_KEYWORDS = [
  "/affiliate", "/affiliates", "/affiliate-program", "/affiliate-programs",
  "/partner", "/partners", "/partner-program", "/partner-programs",
  "/referral", "/referrals", "/refer", "/rewards",
  "/ambassador", "/ambassadors", "/creator", "/creators",
  "/community", "/monetize", "/earn", "/earn-money",
  "/advertise", "/advertising", "/influencer", "/influencers"
];

interface DiscoveryCandidateResult {
  candidateUrl: string;
  network: string;
  programName: string;
  source: string;
  confidence: number;
}

// Fetch helper with AbortController timeout
async function safeFetch(url: string, timeoutMs = 5000): Promise<{ ok: boolean; status: number; text: string; finalUrl: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "AI-Vault-Affiliate-Discovery/1.0 (+https://www.aivault.pp.ua)",
      },
    });

    clearTimeout(timeout);

    if (!res.ok && res.status >= 400) {
      return null;
    }

    const text = await res.text();
    return { ok: true, status: res.status, text, finalUrl: res.url || url };
  } catch {
    return null;
  }
}

// Calculate evidence-based confidence score
function calculateConfidence(pageText: string, targetUrl: string): number {
  let score = 0;
  const lowerText = pageText.toLowerCase();
  const lowerUrl = targetUrl.toLowerCase();

  // Strong Signals
  if (lowerText.includes("affiliate program")) score += 35;
  if (lowerText.includes("affiliate")) score += 20;
  if (lowerText.includes("commission")) score += 15;
  if (lowerText.includes("referral program")) score += 30;
  if (lowerText.includes("partner program")) score += 25;
  if (lowerText.includes("affiliate dashboard")) score += 35;
  if (lowerText.includes("join our affiliate")) score += 35;
  if (lowerText.includes("earn commission")) score += 30;
  if (lowerText.includes("recurring commission")) score += 35;
  if (lowerText.includes("become a partner")) score += 25;
  if (lowerText.includes("ambassador program")) score += 20;

  // URL Signals
  if (lowerUrl.includes("/affiliate")) score += 20;
  if (lowerUrl.includes("/affiliates")) score += 25;
  if (lowerUrl.includes("/partner")) score += 15;
  if (lowerUrl.includes("/partners")) score += 20;
  if (lowerUrl.includes("/referral")) score += 20;
  if (lowerUrl.includes("/ambassador")) score += 20;

  // Third-party Network URL Match
  for (const net of KNOWN_NETWORKS) {
    if (lowerUrl.includes(net.domain)) {
      score += 30;
      break;
    }
  }

  return Math.min(100, score);
}

// Discover candidates from a single tool domain
async function discoverToolAffiliate(toolName: string, websiteUrl: string): Promise<DiscoveryCandidateResult | null> {
  let cleanDomain = "";
  try {
    const parsed = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    cleanDomain = parsed.hostname.replace("www.", "").toLowerCase();
  } catch {
    cleanDomain = websiteUrl.replace(/https?:\/\//, "").replace("www.", "").split("/")[0].toLowerCase();
  }

  if (!cleanDomain) return null;

  const baseOrigin = `https://${cleanDomain}`;
  const candidateUrlsToVerify = new Set<string>();

  // Stage 1: Add candidate path guesses
  for (const p of CANDIDATE_PATH_KEYWORDS) {
    candidateUrlsToVerify.add(`${baseOrigin}${p}`);
  }

  // Stage 2: Homepage inspection & internal link discovery
  const homepage = await safeFetch(baseOrigin, 5000);
  if (homepage && homepage.text) {
    try {
      const $ = cheerio.load(homepage.text);
      $("script, style, noscript").remove();

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const anchorText = $(el).text().toLowerCase();
        const title = $(el).attr("title")?.toLowerCase() || "";
        const ariaLabel = $(el).attr("aria-label")?.toLowerCase() || "";

        if (!href) return;

        const isAffiliateKeyword =
          anchorText.includes("affiliate") || anchorText.includes("partner") ||
          anchorText.includes("referral") || anchorText.includes("ambassador") ||
          anchorText.includes("earn") || anchorText.includes("commission") ||
          title.includes("affiliate") || ariaLabel.includes("affiliate");

        if (isAffiliateKeyword) {
          try {
            const absoluteUrl = new URL(href, baseOrigin).toString();
            candidateUrlsToVerify.add(absoluteUrl);
          } catch {
            // Ignore invalid URLs
          }
        }
      });
    } catch {
      // Non-blocking parsing error
    }
  }

  // Stage 3: Sitemap inspection (limited to 5 relevant candidates)
  const sitemap = await safeFetch(`${baseOrigin}/sitemap.xml`, 4000);
  if (sitemap && sitemap.text) {
    const lowerSitemap = sitemap.text.toLowerCase();
    const locMatches = lowerSitemap.match(/<loc>(.*?)<\/loc>/g) || [];
    let addedCount = 0;

    for (const locTag of locMatches) {
      if (addedCount >= 5) break;
      const cleanLoc = locTag.replace("<loc>", "").replace("</loc>", "").trim();
      if (CANDIDATE_PATH_KEYWORDS.some((kw) => cleanLoc.includes(kw))) {
        candidateUrlsToVerify.add(cleanLoc);
        addedCount++;
      }
    }
  }

  // Stage 4: Verification & Confidence Scoring
  let bestCandidate: DiscoveryCandidateResult | null = null;
  const verifiedList = Array.from(candidateUrlsToVerify).slice(0, 10); // Limit to top 10 candidate URLs per tool

  for (const targetUrl of verifiedList) {
    const page = await safeFetch(targetUrl, 4500);
    if (!page || !page.text) continue;

    const confidence = calculateConfidence(page.text, page.finalUrl || targetUrl);

    // Filter by network provider
    let detectedNetwork = "Direct Public Program";
    for (const net of KNOWN_NETWORKS) {
      if (page.finalUrl.toLowerCase().includes(net.domain) || targetUrl.toLowerCase().includes(net.domain) || page.text.toLowerCase().includes(net.domain)) {
        detectedNetwork = net.name;
        break;
      }
    }

    // Require minimum threshold score of 55
    if (confidence >= 55) {
      const candidate: DiscoveryCandidateResult = {
        candidateUrl: page.finalUrl || targetUrl,
        network: detectedNetwork,
        programName: `${toolName} ${detectedNetwork !== "Direct Public Program" ? detectedNetwork : "Partner"} Program`,
        source: "Multi-Stage Domain Engine",
        confidence,
      };

      if (!bestCandidate || candidate.confidence > bestCandidate.confidence) {
        bestCandidate = candidate;
        if (bestCandidate.confidence >= 90) break; // Early exit on high confidence match
      }
    }
  }

  return bestCandidate;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    let batchSize = 100;
    let offset = 0;

    try {
      const body = await request.json();
      if (body.batchSize) batchSize = parseInt(body.batchSize, 10);
      if (body.offset) offset = parseInt(body.offset, 10);
    } catch {
      // Default batch offset
    }

    console.log(`[affiliate-discovery] started batchSize=${batchSize} offset=${offset}`);

    // Load active network publisher settings
    const { data: enabledNetworks } = await supabase
      .from("affiliate_settings")
      .select("network_name, publisher_id, is_enabled")
      .eq("is_enabled", true);

    const activeNetworks = (enabledNetworks || []).filter((n) => n.publisher_id && n.publisher_id.trim() !== "");
    const isAuthMode = activeNetworks.length > 0;

    // Schema-safe selection from public.ai_tools
    const { data: tools, count: totalTools } = await supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url", { count: "exact" })
      .range(offset, offset + batchSize - 1)
      .order("created_at", { ascending: false });

    if (!tools || tools.length === 0) {
      return NextResponse.json({
        success: true,
        mode: isAuthMode ? "Authenticated API Mode" : "Public Discovery Mode",
        scanned: 0,
        candidatesFound: 0,
        noProgramFound: 0,
        offset,
        batchSize,
        total: totalTools || 0,
        hasMore: false,
        message: "All eligible tool batches processed.",
      });
    }

    // Load active affiliate records to preserve verified candidates
    const { data: existingLinks } = await supabase
      .from("affiliate_links")
      .select("tool_id, status");

    const activeToolIds = new Set(
      (existingLinks || [])
        .filter((l) => l.status === "ACTIVE")
        .map((l) => l.tool_id)
    );

    // Load existing pending candidates to avoid overwriting
    const { data: existingCandidates } = await supabase
      .from("affiliate_candidates")
      .select("tool_id")
      .eq("status", "PENDING_REVIEW");

    const pendingToolIds = new Set((existingCandidates || []).map((c) => c.tool_id));

    let scannedCount = 0;
    let candidatesCount = 0;
    let noProgramCount = 0;

    // Process tools sequentially with per-tool isolation
    for (const tool of tools) {
      if (activeToolIds.has(tool.id) || pendingToolIds.has(tool.id)) {
        continue;
      }
      scannedCount++;

      try {
        const websiteUrl = tool.website_url;
        if (!websiteUrl) {
          await supabase.from("affiliate_links").upsert(
            {
              tool_id: tool.id,
              status: "DISCOVERY_REQUIRED",
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: "tool_id" }
          );
          continue;
        }

        let candidateFound = false;

        // MODE 1: AUTHENTICATED MODE (If network credentials configured)
        if (isAuthMode) {
          // Placeholder for direct network API integrations (Impact, PartnerStack, CJ API sync)
        }

        // MODE 2: MULTI-STAGE PUBLIC DISCOVERY ENGINE
        if (!candidateFound) {
          const discoveredCandidate = await discoverToolAffiliate(tool.name, websiteUrl);

          if (discoveredCandidate) {
            candidateFound = true;
            candidatesCount++;

            await supabase.from("affiliate_candidates").upsert(
              {
                tool_id: tool.id,
                tool_name: tool.name,
                tool_slug: tool.slug,
                official_url: websiteUrl,
                network: discoveredCandidate.network,
                program_name: discoveredCandidate.programName,
                destination_url: websiteUrl,
                candidate_url: discoveredCandidate.candidateUrl,
                source: discoveredCandidate.source,
                confidence: discoveredCandidate.confidence,
                status: "PENDING_REVIEW",
                discovered_at: new Date().toISOString(),
              },
              { onConflict: "tool_id,candidate_url" }
            );

            await supabase.from("affiliate_links").upsert(
              {
                tool_id: tool.id,
                network_name: discoveredCandidate.network,
                program_name: discoveredCandidate.programName,
                status: "PENDING_REVIEW",
                last_checked_at: new Date().toISOString(),
              },
              { onConflict: "tool_id" }
            );
          }
        }

        if (!candidateFound) {
          noProgramCount++;
          await supabase.from("affiliate_links").upsert(
            {
              tool_id: tool.id,
              status: "NO_PROGRAM_FOUND",
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: "tool_id" }
          );
        }
      } catch (toolErr) {
        console.warn(`[affiliate-discovery] Failed tool=${tool.slug}:`, toolErr);
        // Continue to next tool in batch
      }
    }

    const hasMore = offset + batchSize < (totalTools || 0);

    console.log(`[affiliate-discovery] mode=${isAuthMode ? "AUTH" : "PUBLIC"} scanned=${scannedCount} candidates=${candidatesCount} noProgram=${noProgramCount}`);

    return NextResponse.json({
      success: true,
      mode: isAuthMode ? "Authenticated API Mode" : "Public Discovery Mode",
      scanned: scannedCount,
      candidatesFound: candidatesCount,
      noProgramFound: noProgramCount,
      offset,
      batchSize,
      total: totalTools || 0,
      hasMore,
      message: `Public Discovery complete. Scanned ${scannedCount} tools. Found ${candidatesCount} verified affiliate candidates. ${noProgramCount} have no verified affiliate program.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled discovery exception";
    console.error("[affiliate-discovery][EXCEPTION]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
