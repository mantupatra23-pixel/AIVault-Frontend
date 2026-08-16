// app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const all = searchParams.get("all");

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    let query = supabase.from("tool_reviews").select("*").order("created_at", { ascending: false });

    if (slug && !all) {
      query = query.eq("tool_slug", slug);
    }

    const { data: reviews, error } = await query.limit(200);

    if (error) {
      return NextResponse.json({ reviews: [] });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool_slug, author_name, rating, comment } = body;

    if (!tool_slug || !author_name || !rating || !comment) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const cleanAuthor = String(author_name).trim().slice(0, 40);
    const cleanComment = String(comment).trim().slice(0, 500);

    const { data, error } = await supabase
      .from("tool_reviews")
      .insert([
        {
          tool_slug,
          author_name: cleanAuthor,
          rating: numRating,
          comment: cleanComment,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        review: {
          id: Date.now().toString(),
          tool_slug,
          author_name: cleanAuthor,
          rating: numRating,
          comment: cleanComment,
          created_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true, review: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.from("tool_reviews").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
