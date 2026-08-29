import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("affiliate_status", "inquiry_message")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const inquiries = (data || []).map((row) => {
      let email = "";
      let subject = row.category || "General Inquiry";
      let toolName = "General";
      let txId = "";

      if (row.affiliate_network) {
        const emailMatch = row.affiliate_network.match(/Email:\s*([^\s|]+)/);
        if (emailMatch) email = emailMatch[1].trim();

        const subjectMatch = row.affiliate_network.match(/Subject:\s*([^|]+)/);
        if (subjectMatch) subject = subjectMatch[1].trim();

        const toolMatch = row.affiliate_network.match(/Tool:\s*([^|]+)/);
        if (toolMatch) toolName = toolMatch[1].trim();

        const txMatch = row.affiliate_network.match(/Tx:\s*([^|]+)/);
        if (txMatch) txId = txMatch[1].trim();
      }

      if (!email && row.website_url) {
        email = row.website_url.replace("https://mailto:", "");
      }

      return {
        id: row.id,
        name: row.name || "Founder",
        email: email || "Direct Contact",
        subject: subject,
        issue_type: subject,
        tool_name: toolName,
        transaction_id: txId || (row.pricing?.includes("Tx:") ? row.pricing : "Direct Message"),
        message: row.description || row.overview || "",
        status: "unread",
        created_at: row.created_at || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      inquiries,
      count: inquiries.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch inquiries";
    return NextResponse.json({ error: msg, inquiries: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (action === "delete" && id) {
      const { error } = await supabase.from("ai_tools").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: "Deleted successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
