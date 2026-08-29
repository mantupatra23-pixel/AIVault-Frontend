import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

type UnifiedInquiry = {
  id: string | number;
  name: string;
  email: string;
  subject: string;
  issue_type: string;
  tool_name: string;
  tier?: string;
  transaction_id?: string;
  message: string;
  status: string;
  created_at: string;
};

export async function GET() {
  try {
    const supabase = getSupabase();
    const results: UnifiedInquiry[] = [];

    // Source 1: inquiries table
    try {
      const { data: inqData } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (inqData) {
        inqData.forEach((item) => {
          results.push({
            id: item.id,
            name: item.name || "Founder",
            email: item.email || "No email",
            subject: item.subject || item.issue_type || "Direct Message",
            issue_type: item.issue_type || item.subject || "General Inquiry",
            tool_name: item.tool_name || "General",
            tier: item.tier || "Standard",
            transaction_id: item.transaction_id || "N/A",
            message: item.message || "",
            status: item.status || "unread",
            created_at: item.created_at || new Date().toISOString(),
          });
        });
      }
    } catch {}

    // Source 2: ai_tools fail-safe table
    try {
      const { data: toolTickets } = await supabase
        .from("ai_tools")
        .select("*")
        .eq("affiliate_status", "inquiry_ticket")
        .order("created_at", { ascending: false });

      if (toolTickets) {
        toolTickets.forEach((t) => {
          let email = t.website_url || t.website || "";
          if (t.affiliate_network && t.affiliate_network.includes("Email:")) {
            const match = t.affiliate_network.match(/Email:\s*([^\s|]+)/);
            if (match) email = match[1].trim();
          }

          results.push({
            id: t.id,
            name: t.name || "Founder",
            email: email || "Direct Contact",
            subject: t.category || "Contact Message",
            issue_type: t.category || "Contact Message",
            tool_name: t.name || "General",
            tier: "Direct Submission",
            transaction_id: "Auto-Logged",
            message: t.description || t.overview || "",
            status: "unread",
            created_at: t.created_at || new Date().toISOString(),
          });
        });
      }
    } catch {}

    // Deduplicate and Sort
    const map = new Map<string, UnifiedInquiry>();
    results.forEach((r) => {
      const key = `${r.email}_${r.message.slice(0, 30)}`;
      if (!map.has(key)) map.set(key, r);
    });

    const finalInquiries = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      inquiries: finalInquiries,
      count: finalInquiries.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load inquiries";
    return NextResponse.json({ error: msg, inquiries: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    const supabase = getSupabase();

    if (action === "delete" && id) {
      await supabase.from("inquiries").delete().eq("id", id);
      await supabase.from("ai_tools").delete().eq("id", id);
      return NextResponse.json({ success: true, message: "Deleted successfully" });
    }

    if (action === "read" && id) {
      await supabase.from("inquiries").update({ status: "read" }).eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process inquiry" }, { status: 500 });
  }
}
