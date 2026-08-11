import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Helper: Safely verify public merchant domain for legitimate partner/affiliate pages
async function verifyPublicAffiliateProgram(domainUrl: string): Promise<{ candidateUrl: string; network: string; programName: string } | null> {
  let cleanDomain = "";
  try {
    const parsed = new URL(domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`);
    cleanDomain = parsed.hostname.replace("www.", "").toLowerCase();
  } catch {
    cleanDomain = domainUrl.replace(/https?:\/\//, "").replace("www.", "").split("/")[0].toLowerCase();
  }

  const publicPaths = ["/affiliates", "/partner", "/partners", "/referral", "/affiliate"];

  for (const path of publicPaths) {
    try {
      const targetCheck = `https://${cleanDomain}${path}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(targetCheck, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "AI-Vault-PublicDiscovery/1.0" },
      });

      clearTimeout(timeout);

      if (res.status >= 200 && res.status < 400) {
        const pageText = (await res.text()).toLowerCase();
        
        // Content verification: Ensure page explicitly mentions partner or affiliate program terms
        const hasAffiliateContext = 
          pageText.includes("affiliate") || 
          pageText.includes("partner program") || 
          pageText.includes("commission") || 
          pageText.includes("referral") ||
          pageText.includes("join program");

        if (hasAffiliateContext) {
          return {
            candidateUrl: targetCheck,
            network: "Direct Public Program",
            programName: `${cleanDomain} Public Partner Portal`,
          };
        }
      }
    } catch {
      // Continue inspecting next path safely without crashing batch execution
    }
  }

  return null;
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
      // Fallback to defaults if empty request body
    }

    console.log(`[affiliate-discovery] started batchSize=${batchSize} offset=${offset}`);

    // 1. Load active network credentials
    const { data: enabledNetworks } = await supabase
      .from("affiliate_settings")
      .select("network_name, publisher_id, api_key_encrypted, is_enabled")
      .eq("is_enabled", true);

    const activeNetworks = (enabledNetworks || []).filter((n) => n.publisher_id && n.publisher_id.trim() !== "");
    const isAuthMode = activeNetworks.length > 0;

    // 2. Load schema-safe tools batch from public.ai_tools
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

    // 3. Load active affiliate records to skip already monetized tools
    const { data: existingLinks } = await supabase
      .from("affiliate_links")
      .select("tool_id, status");

    const activeToolIds = new Set(
      (existingLinks || [])
        .filter((l) => l.status === "ACTIVE")
        .map((l) => l.tool_id)
    );

    let scannedCount = 0;
    let candidatesCount = 0;
    let noProgramCount = 0;

    // Process batch tools with isolated try-catch to prevent a single tool failure from halting the batch
    for (const tool of tools) {
      if (activeToolIds.has(tool.id)) continue;
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

        // MODE 1: AUTHENTICATED NETWORK SCAN
        if (isAuthMode) {
          // Placeholder for official network API endpoints (Impact, PartnerStack, CJ API sync)
          // Avoid fabricating guessed URLs when network APIs return no confirmed records
        }

        // MODE 2: PUBLIC DOMAIN VERIFICATION
        if (!candidateFound) {
          const publicProgram = await verifyPublicAffiliateProgram(websiteUrl);

          if (publicProgram) {
            candidateFound = true;
            candidatesCount++;

            await supabase.from("affiliate_candidates").upsert(
              {
                tool_id: tool.id,
                tool_name: tool.name,
                tool_slug: tool.slug,
                official_url: websiteUrl,
                network: publicProgram.network,
                program_name: publicProgram.programName,
                destination_url: websiteUrl,
                candidate_url: publicProgram.candidateUrl,
                source: "Public Domain Verification",
                confidence: 80,
                status: "PENDING_REVIEW",
                discovered_at: new Date().toISOString(),
              },
              { onConflict: "tool_id,candidate_url" }
            );

            await supabase.from("affiliate_links").upsert(
              {
                tool_id: tool.id,
                network_name: publicProgram.network,
                program_name: publicProgram.programName,
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
        console.error(`[affiliate-discovery][TOOL_ERR] Failed processing tool ${tool.slug}:`, toolErr);
        // Continue to next tool in batch
      }
    }

    const hasMore = offset + batchSize < (totalTools || 0);

    console.log(`[affiliate-discovery] mode=${isAuthMode ? "AUTH" : "PUBLIC"} scanned=${scannedCount} candidates=${candidatesCount} noProgram=${noProgramCount}`);

    return NextResponse.json({
      success: true,
      mode: isAuthMode ? "Authenticated API Mode" : "Public Discovery Mode",
      scanned: scannedCount,
      candidatesFound: candidatesCount, // Mapping correctly to candidatesCount
      noProgramFound: noProgramCount,
      offset,
      batchSize,
      total: totalTools || 0,
      hasMore,
      message: `Batch scan complete (${offset + 1}–${offset + scannedCount} of ${totalTools}). Discovered ${candidatesCount} candidates. ${noProgramCount} marked No Program.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled discovery exception";
    console.error("[affiliate-discovery][EXCEPTION]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
