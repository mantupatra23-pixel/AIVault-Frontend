import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const CATEGORIES = [
  "marketing",
  "productivity",
  "chatbot",
  "coding",
  "image",
  "writing",
  "audio",
  "video",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secret = searchParams.get("secret");

    if (
      process.env.CRON_SECRET &&
      secret !== process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !rawPrivateKey) {
      return NextResponse.json(
        { error: "Google Service Account environment variables missing on Vercel" },
        { status: 500 }
      );
    }

    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

    const jwtClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });

    await jwtClient.authorize();
    const indexing = google.indexing({ version: "v3", auth: jwtClient });

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tools, error: dbError } = await supabase
      .from("ai_tools")
      .select("slug")
      .not("slug", "is", null)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(180);

    if (dbError || !tools) {
      return NextResponse.json({ error: "Database error", detail: dbError }, { status: 500 });
    }

    const urlsToSubmit = [
      `${BASE_URL}`,
      `${BASE_URL}/compare`,
      `${BASE_URL}/vault`,
      ...CATEGORIES.map((cat) => `${BASE_URL}/category/${cat}`),
      ...tools.map((t) => `${BASE_URL}/tool/${t.slug}`),
    ];

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const url of urlsToSubmit) {
      try {
        await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: "URL_UPDATED",
          },
        });
        successful++;
      } catch (err: unknown) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${url}: ${message}`);
        if (message.includes("Quota exceeded")) break;
      }
    }

    return NextResponse.json({
      success: true,
      submitted: urlsToSubmit.length,
      successful,
      failed,
      sampleErrors: errors.slice(0, 3),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
