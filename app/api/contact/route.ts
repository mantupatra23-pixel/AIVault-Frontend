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

    if (!cleanEmail || !cleanMessage) {
      return NextResponse.json({ error: "Email and Message are required." }, { status: 400 });
    }

    const supabase = getSupabase();
    const payload = {
      name: cleanName,
      email: cleanEmail,
      subject: String(subject || issue_type || "General Inquiry"),
      issue_type: String(issue_type || subject || "General Contact"),
      message: cleanMessage,
      tool_name: tool_name ? String(tool_name) : null,
      tier: tier ? String(tier) : null,
      transaction_id: transaction_id ? String(transaction_id) : null,
      status: "unread",
      created_at: new Date().toISOString(),
    };

    // 1. Insert into inquiries table
    const { data, error } = await supabase.from("inquiries").insert([payload]).select().maybeSingle();

    if (error) {
      console.warn("Inquiries table fallback, writing to messages table:", error.message);
      await supabase.from("messages").insert([{
        name: cleanName,
        email: cleanEmail,
        subject: String(subject || issue_type || "General Inquiry"),
        message: cleanMessage,
        status: "unread",
        created_at: new Date().toISOString(),
      }]);
    }

    return NextResponse.json({ success: true, message: "Message received successfully!", data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
