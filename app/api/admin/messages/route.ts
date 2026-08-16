// app/api/admin/messages/route.ts
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: "Missing DB keys" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, messages: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fetch error";
    return NextResponse.json({ error: msg, messages: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (action === "read") {
      await supabase
        .from("contact_messages")
        .update({ status: "read" })
        .eq("id", id);
    } else if (action === "delete") {
      await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Action error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
