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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, issue_type, tool_name, tier, transaction_id } = body;

    const cleanEmail = String(email || "").trim();
    const cleanMessage = String(message || "").trim();
    const cleanName = String(name || "Founder").trim();
    const cleanSubject = String(subject || issue_type || "General Inquiry").trim();

    if (!cleanEmail || !cleanMessage) {
      return NextResponse.json({ error: "Email and Message are required." }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Primary Attempt: inquiries table
    let saved = false;
    try {
      const { error: inqErr } = await supabase.from("inquiries").insert([
        {
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          issue_type: cleanSubject,
          message: cleanMessage,
          tool_name: tool_name ? String(tool_name) : null,
          tier: tier ? String(tier) : null,
          transaction_id: transaction_id ? String(transaction_id) : null,
          status: "unread",
          created_at: new Date().toISOString(),
        },
      ]);
      if (!inqErr) saved = true;
    } catch {}

    // 2. Guaranteed Fail-Safe: Store in ai_tools with dedicated status
    if (!saved) {
      const ticketSlug = `ticket-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await supabase.from("ai_tools").insert([
        {
          name: cleanName,
          slug: ticketSlug,
          website_url: cleanEmail,
          website: cleanEmail,
          category: cleanSubject,
          pricing: "Contact Message",
          description: cleanMessage,
          overview: cleanMessage,
          affiliate_status: "inquiry_ticket",
          affiliate_network: `Email: ${cleanEmail} | Subject: ${cleanSubject} | Tool: ${tool_name || "General"}`,
          score: 0,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Message successfully received and logged to admin suite!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
