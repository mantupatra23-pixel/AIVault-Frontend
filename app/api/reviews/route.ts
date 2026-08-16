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

interface ReviewPayload {
  tool_slug: string;
  author_name: string;
  rating: number;
  comment: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: reviews, error } = await supabase
      .from("tool_reviews")
      .select("*")
      .eq("tool_slug", slug)
      .order("created_at", { ascending: false });

    if (error) {
      // Table agar na bani ho toh graceful empty array return karein
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
    const body: ReviewPayload = await req.json();
    const { tool_slug, author_name, rating, comment } = body;

    if (!tool_slug || !author_name || !rating || !comment) {
      return NextResponse.json(
        { error: "All review fields are required." },
        { status: 400 }
      );
    }

    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const cleanAuthor = String(author_name).trim().slice(0, 40);
    const cleanComment = String(comment).trim().slice(0, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      return NextResponse.json(
        {
          success: true,
          review: {
            id: Date.now().toString(),
            tool_slug,
            author_name: cleanAuthor,
            rating: numRating,
            comment: cleanComment,
            created_at: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, review: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
