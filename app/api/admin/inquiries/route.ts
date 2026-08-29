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

export async function GET() {
  try {
    const supabase = getSupabase();

    // Fetch from inquiries table (Service Role bypasses RLS)
    const { data: inqData } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch from messages table (fallback)
    const { data: msgData } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    type RawMessage = {
      id?: string | number;
      name?: string | null;
      email?: string | null;
      subject?: string | null;
      issue_type?: string | null;
      tool_name?: string | null;
      tier?: string | null;
      transaction_id?: string | null;
      message?: string | null;
      status?: string | null;
      created_at?: string | null;
    };

    const combined: RawMessage[] = [
      ...((inqData as RawMessage[]) || []),
      ...(((msgData as RawMessage[]) || []).map((m) => ({
        id: m.id,
        name: m.name || "Founder",
        email: m.email,
        subject: m.subject || "Direct Message",
        issue_type: m.subject || "Direct Message",
        message: m.message,
        status: m.status || "unread",
        created_at: m.created_at || new Date().toISOString(),
      }))),
    ];

    // Deduplicate
    const uniqueMap = new Map<string, RawMessage>();
    combined.forEach((item) => {
      const key = `${item.email}_${String(item.message || "").slice(0, 25)}_${String(item.created_at || "").slice(0, 16)}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const finalInquiries = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({ success: true, inquiries: finalInquiries, count: finalInquiries.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch inquiries";
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
      await supabase.from("messages").delete().eq("id", id);
      return NextResponse.json({ success: true });
    }

    if (action === "read" && id) {
      await supabase.from("inquiries").update({ status: "read" }).eq("id", id);
      await supabase.from("messages").update({ status: "read" }).eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
