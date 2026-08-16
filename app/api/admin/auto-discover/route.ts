// app/api/admin/auto-discover/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Sirf wo tools uthao jinme website_url hai
  const { data: tools } = await supabase
    .from("ai_tools")
    .select("id, website_url")
    .not("website_url", "is", null);

  let updatedCount = 0;

  if (tools) {
    for (const tool of tools) {
      const url = tool.website_url;
      // Sirf valid URL patterns ko hi affiliate link me convert karein
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        const separator = url.includes("?") ? "&" : "?";
        const affUrl = `${url}${separator}ref=aivault`;

        await supabase
          .from("ai_tools")
          .update({ 
            affiliate_url: affUrl,
            affiliate_status: "active_monetized" 
          })
          .eq("id", tool.id);
        updatedCount++;
      }
    }
  }

  return NextResponse.json({ success: true, updated: updatedCount });
}

