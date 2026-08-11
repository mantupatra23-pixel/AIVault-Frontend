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

// Known affiliate networks & SaaS providers detected from page links / HTML
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
  { domain: "tune.com", name: "TUNE" },
];

const CANDIDATE_PATH_KEYWORDS = [
  "/affiliate", "/affiliates", "/affiliate-program", "/affiliate-programs",
  "/partners", "/partner", "/partner-program", "/partnership", "/partnerships",
  "/referral", "/referrals", "/ambassador", "/ambassadors",
  "/creator", "/creators", "/reseller", "/resellers",
  "/rewards", "/refer", "/earn", "/monetize"
];

// Ignore non-affiliate utility paths
const EXCLUDED_PATH_KEYWORDS = [
  "/about", "/contact", "/careers", "/login", "/signup",
  "/pricing", "/blog", "/docs", "/support", "/terms", "/privacy", "/faq"
];

interface DiscoveryCandidateResult {
  candidateUrl: string;
  network: string;
  programName: string;
  source: string;
  confidence: number;
}

// Fetch helper with AbortController timeout & HTTP 200 validation
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

    if (!res.ok || res.status >= 400) {
      return null;
    }

    const text = await res.text();
    return { ok: true, status: res.status, text, finalUrl: res.url || url };
  } catch {
    return null;
  }
}

// Deterministic Confidence Scoring System
function calculateConfidence(pageText: string, targetUrl: string, anchorText = ""): number {
  let score = 0;
  const lowerText = pageText.toLowerCase();
  const lowerUrl = targetUrl.toLowerCase();
  const lowerAnchor = anchorText.toLowerCase();

  // 1. Text Content Signals
  if (lowerText.includes("affiliate program")) score += 50;
  else if (lowerText.includes("affiliate")) score += 20;

  if (lowerText.includes("referral program")) score += 35;
  if (lowerText.includes("partner program")) score += 30;
  if (lowerText.includes("commission")) score += 25;
  if (lowerText.includes("earn commission") || lowerText.includes("recurring commission")) score += 25;
  if (lowerText.includes("referral link") || lowerText.includes("affiliate dashboard")) score += 25;

  // 2. URL Signals
  if (lowerUrl.includes("/affiliate")) score += 35;
  if (lowerUrl.includes("/partner")) score += 30;
  if (lowerUrl.includes("/referral")) score += 25;
  if (lowerUrl.includes("/ambassador")) score += 20;

  // 3. Anchor Text Signals
  if (lowerAnchor.includes("affiliate") || lowerAnchor.includes("partner") || lowerAnchor.includes("refer")) {
    score += 20;
  }

  // 4. Known Affiliate Network Signal
  for (const net of KNOWN_NETWORKS) {
    if (lowerUrl.includes(net.domain) || lowerText.includes(net.domain)) {
      score += 25;
      break;
    }
  }

  return Math.min(99, score);
}

// Multi-Stage Public Discovery Process for an Individual Tool
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
  const candidateUrlsToVerify = new Map<string, string>(); // Map<URL, AnchorText>

  // Stage 1: Add Common Candidate Path Guesses
  for (const p of CANDIDATE_PATH_KEYWORDS) {
    candidateUrlsToVerify.set(`${baseOrigin}${p}`, "Candidate Path Guess");
  }

  // Stage 2: Homepage Inspection & HTML Link Crawling via Cheerio
  const homepage = await safeFetch(baseOrigin, 5000);
  if (homepage && homepage.text) {
    try {
      const $ = cheerio.load(homepage.text);
      $("script, style, noscript").remove();

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const anchorText = $(el).text().trim().toLowerCase();
        const title = $(el).attr("title")?.toLowerCase() || "";
        const ariaLabel = $(el).attr("aria-label")?.toLowerCase() || "";

        if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
          return;
        }

        const isAffiliateKeyword =
          anchorText.includes("affiliate") || anchorText.includes("partner") ||
          anchorText.includes("referral") || anchorText.includes("ambassador") ||
          anchorText.includes("earn") || anchorText.includes("reseller") ||
          title.includes("affiliate") || ariaLabel.includes("affiliate");

        if (isAffiliateKeyword) {
          try {
            const absoluteUrl = new URL(href, baseOrigin).toString();

            // Filter out false-positive utility paths
            const isExcluded = EXCLUDED_PATH_KEYWORDS.some((ex) => absoluteUrl.toLowerCase().includes(ex) && !absoluteUrl.toLowerCase().includes("affiliate"));
            if (!isExcluded) {
              candidateUrlsToVerify.set(absoluteUrl, anchorText);
            }
          } catch {
            // Ignore invalid URL formats
          }
        }
      });
    } catch {
      // Non-blocking HTML parsing exception
    }
  }

  // Stage 3: Sitemap Inspection (/robots.txt & /sitemap.xml)
  const robots = await safeFetch(`${baseOrigin}/robots.txt`, 4000);
  let sitemapUrl = `${baseOrigin}/sitemap.xml`;

  if (robots && robots.text) {
    const sitemapMatch = robots.text.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
    if (sitemapMatch && sitemapMatch[1]) {
      sitemapUrl = sitemapMatch[1].trim();
    }
  }

  const sitemap = await safeFetch(sitemapUrl, 5000);
  if (sitemap && sitemap.text) {
    const lowerSitemap = sitemap.text.toLowerCase();
    const locMatches = lowerSitemap.match(/<loc>(.*?)<\/loc>/g) || [];
    let addedFromSitemap = 0;

    for (const locTag of locMatches) {
      if (addedFromSitemap >= 20) break; // Limit sitemap derived URLs to max 20
      const cleanLoc = locTag.replace("<loc>", "").replace("</loc>", "").trim();
      if (CANDIDATE_PATH_KEYWORDS.some((kw) => cleanLoc.includes(kw))) {
        if (!candidateUrlsToVerify.has(cleanLoc)) {
          candidateUrlsToVerify.set(cleanLoc, "Sitemap Link");
          addedFromSitemap++;
        }
      }
    }
  }

  // Stage 4: Verification & Confidence Evaluation
  let bestCandidate: DiscoveryCandidateResult | null = null;
  const candidateList = Array.from(candidateUrlsToVerify.entries()).slice(0, 15); // Maximum 15 candidates checked per tool

  for (const [targetUrl, anchorText] of candidateList) {
    const page = await safeFetch(targetUrl, 5000);
    if (!page || !page.text) continue;

    const confidence = calculateConfidence(page.text, page.finalUrl || targetUrl, anchorText);

    // Network provider detection
    let detectedNetwork = "Direct Public Program";
    for (const net of KNOWN_NETWORKS) {
      if (page.finalUrl.toLowerCase().includes(net.domain) || targetUrl.toLowerCase().includes(net.domain) || page.text.toLowerCase().includes(net.domain)) {
        detectedNetwork = net.name;
        break;
      }
    }

    // Require minimum threshold score of 70
    if (confidence >= 70) {
      const candidate: DiscoveryCandidateResult = {
        candidateUrl: page.finalUrl || targetUrl,
        network: detectedNetwork,
        programName: `${toolName} ${detectedNetwork !== "Direct Public Program" ? detectedNetwork : "Partner"} Program`,
        source: "Public Domain Engine",
        confidence,
      };

      if (!bestCandidate || candidate.confidence > bestCandidate.confidence) {
        bestCandidate = candidate;
        if (bestCandidate.confidence >= 95) break; // High confidence match exit
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
      // Use defaults if empty body
    }

    console.log(`[affiliate-discovery] started batchSize=${batchSize} offset=${offset}`);

    // Schema-safe selection: ONLY query verified columns from public.ai_tools
    const { data: tools, count: totalTools, error: selectErr } = await supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url", { count: "exact" })
      .range(offset, offset + batchSize - 1)
      .order("created_at", { ascending: false });

    if (selectErr) {
      console.error("[affiliate-discovery][DB] Select error:", selectErr.message);
      return NextResponse.json({ error: selectErr.message }, { status: 500 });
    }

    if (!tools || tools.length === 0) {
      return NextResponse.json({
        success: true,
        mode: "Public Discovery Mode",
        scanned: 0,
        candidatesFound: 0,
        noProgramFound: 0,
        verifiedCandidates: 0,
        errors: 0,
        offset,
        batchSize,
        total: totalTools || 0,
        hasMore: false,
        message: "All eligible tool batches processed.",
      });
    }

    // Load existing active affiliate links to skip
    const { data: existingLinks } = await supabase
      .from("affiliate_links")
      .select("tool_id, status");

    const activeToolIds = new Set(
      (existingLinks || [])
        .filter((l) => l.status === "ACTIVE")
        .map((l) => l.tool_id)
    );

    // Load existing pending candidates to preserve review queues
    const { data: existingCandidates } = await supabase
      .from("affiliate_candidates")
      .select("tool_id")
      .eq("status", "PENDING_REVIEW");

    const pendingToolIds = new Set((existingCandidates || []).map((c) => c.tool_id));

    let scannedCount = 0;
    let candidatesCount = 0;
    let noProgramCount = 0;
    let errorCount = 0;

    // Process batch tools in chunks of 5 concurrent jobs to avoid serverless memory/timeout overloads
    const concurrencyLimit = 5;
    for (let i = 0; i < tools.length; i += concurrencyLimit) {
      const chunk = tools.slice(i, i + concurrencyLimit);

      await Promise.all(
        chunk.map(async (tool) => {
          if (activeToolIds.has(tool.id) || pendingToolIds.has(tool.id)) {
            return;
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
              return;
            }

            console.log(`[affiliate-discovery] tool=${tool.slug} domain=${websiteUrl}`);

            const candidate = await discoverToolAffiliate(tool.name, websiteUrl);

            if (candidate) {
              candidatesCount++;
              console.log(`[affiliate-discovery] candidate found tool=${tool.slug} url=${candidate.candidateUrl} confidence=${candidate.confidence}`);

              const { error: candErr } = await supabase.from("affiliate_candidates").upsert(
                {
                  tool_id: tool.id,
                  tool_name: tool.name,
                  tool_slug: tool.slug,
                  official_url: websiteUrl,
                  network: candidate.network,
                  program_name: candidate.programName,
                  destination_url: websiteUrl,
                  candidate_url: candidate.candidateUrl,
                  source: candidate.source,
                  confidence: candidate.confidence,
                  status: "PENDING_REVIEW",
                  discovered_at: new Date().toISOString(),
                },
                { onConflict: "tool_id,candidate_url" }
              );

              if (candErr) console.error("[affiliate-discovery][DB] Candidate upsert err:", candErr.message);

              const { error: linkErr } = await supabase.from("affiliate_links").upsert(
                {
                  tool_id: tool.id,
                  network_name: candidate.network,
                  program_name: candidate.programName,
                  status: "PENDING_REVIEW",
                  last_checked_at: new Date().toISOString(),
                },
                { onConflict: "tool_id" }
              );

              if (linkErr) console.error("[affiliate-discovery][DB] Link upsert err:", linkErr.message);
            } else {
              noProgramCount++;
              console.log(`[affiliate-discovery] no program tool=${tool.slug}`);

              await supabase.from("affiliate_links").upsert(
                {
                  tool_id: tool.id,
                  status: "NO_PROGRAM_FOUND",
                  last_checked_at: new Date().toISOString(),
                },
                { onConflict: "tool_id" }
              );
            }
          } catch (toolErr: unknown) {
            errorCount++;
            const reason = toolErr instanceof Error ? toolErr.message : "Unknown failure";
            console.error(`[affiliate-discovery] error tool=${tool.slug} reason=${reason}`);
          }
        })
      );
    }

    const hasMore = offset + batchSize < (totalTools || 0);

    console.log(`[affiliate-discovery] completed scanned=${scannedCount} candidates=${candidatesCount} noProgram=${noProgramCount}`);

    return NextResponse.json({
      success: true,
      mode: "Public Discovery Mode",
      scanned: scannedCount,
      candidatesFound: candidatesCount,
      noProgramFound: noProgramCount,
      verifiedCandidates: candidatesCount,
      errors: errorCount,
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
