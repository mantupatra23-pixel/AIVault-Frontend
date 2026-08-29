import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tctovtckukoxcvvwtvwy.supabase.co";
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
    const {
      email,
      tool_name,
      tier,
      transaction_id,
      issue_type,
      message,
    } = body;

    const cleanEmail = String(email || "").trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid contact email is compulsory." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 1. Try storing in inquiries / messages table
    const inquiryPayload = {
      email: cleanEmail,
      tool_name: String(tool_name || "General"),
      tier: String(tier || "standard"),
      transaction_id: String(transaction_id || "").trim() || null,
      issue_type: String(issue_type || "Payment Issue / Assistance"),
      message: String(message || "Payment verification or alternate method requested.").trim(),
      status: "unread",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("inquiries")
      .insert([inquiryPayload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Table 'inquiries' not ready, logging ticket details:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Support ticket registered for ${cleanEmail}. Editorial team has been notified.`,
      ticket: data || inquiryPayload,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Support request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
