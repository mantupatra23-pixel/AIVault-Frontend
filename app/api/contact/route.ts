import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, issue_type, tool_name, transaction_id } = body;

    const cleanEmail = String(email || "").trim();
    const cleanMessage = String(message || "").trim();
    const cleanName = String(name || "Founder").trim();
    const cleanSubject = String(subject || issue_type || "General Inquiry").trim();
    const cleanTool = String(tool_name || "General").trim();
    const cleanTx = String(transaction_id || "N/A").trim();

    if (!cleanEmail || !cleanMessage) {
      return NextResponse.json({ error: "Email and Message are required." }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: "Database configuration missing." }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const slug = `inquiry-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Exact Supabase ai_tools schema (NO 'website', NO 'tagline', NO 'pricing_model')
    const payload: Record<string, unknown> = {
      name: cleanName,
      slug: slug,
      website_url: `https://mailto:${cleanEmail}`,
      category: cleanSubject,
      pricing: cleanTx !== "N/A" ? `Tx: ${cleanTx}` : "Direct Contact",
      description: cleanMessage,
      overview: cleanMessage,
      score: 90,
      ai_vault_score: 90,
      affiliate_status: "inquiry_message",
      affiliate_network: `Email: ${cleanEmail} | Subject: ${cleanSubject} | Tool: ${cleanTool} | Tx: ${cleanTx}`,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("ai_tools").insert([payload]).select().single();

    if (error) {
      console.error("Inquiry Insert Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Message delivered successfully to admin desk!",
      data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to deliver message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
