import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const REAL_TRENDING_TOOLS = [
  {
    name: "DeepSeek",
    slug: "deepseek",
    category: "coding",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 99,
    ai_vault_score: 99,
    tagline: "Open-source reasoning model rivaling frontier LLMs at 10x lower cost.",
    overview: "DeepSeek is an advanced open-source AI platform featuring DeepSeek-V3 and DeepSeek-R1 reasoning architectures for programming, mathematics, and multi-step logic.",
    description: "DeepSeek is an advanced open-source AI platform featuring DeepSeek-V3 and DeepSeek-R1 reasoning architectures for programming, mathematics, and multi-step logic.",
    website_url: "https://www.deepseek.com",
    logo_url: "https://www.google.com/s2/favicons?domain=deepseek.com&sz=128"
  },
  {
    name: "Cursor",
    slug: "cursor",
    category: "coding",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 99,
    ai_vault_score: 99,
    tagline: "The AI-first code editor built for hyper-productive software engineering.",
    overview: "Cursor is a specialized IDE supercharged with Claude 3.5 Sonnet and GPT-4o, allowing full codebase indexing, multi-file editing, and inline terminal debugging.",
    description: "Cursor is a specialized IDE supercharged with Claude 3.5 Sonnet and GPT-4o, allowing full codebase indexing, multi-file editing, and inline terminal debugging.",
    website_url: "https://www.cursor.com",
    logo_url: "https://www.google.com/s2/favicons?domain=cursor.com&sz=128"
  },
  {
    name: "Claude 3.5 Sonnet",
    slug: "claude",
    category: "chatbot",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 99,
    ai_vault_score: 99,
    tagline: "Anthropic flagship model leading coding, nuance, and visual reasoning.",
    overview: "Claude 3.5 Sonnet offers frontier intelligence for complex reasoning, artifact rendering, and autonomous software development with a 200K token context window.",
    description: "Claude 3.5 Sonnet offers frontier intelligence for complex reasoning, artifact rendering, and autonomous software development with a 200K token context window.",
    website_url: "https://claude.ai",
    logo_url: "https://www.google.com/s2/favicons?domain=anthropic.com&sz=128"
  },
  {
    name: "Lovable",
    slug: "lovable",
    category: "coding",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 98,
    ai_vault_score: 98,
    tagline: "Build full-stack production web apps directly from plain English prompts.",
    overview: "Lovable AI acts as an autonomous engineer that builds, debugs, and deploys full React, Tailwind, and Supabase full-stack applications instantly from text prompts.",
    description: "Lovable AI acts as an autonomous engineer that builds, debugs, and deploys full React, Tailwind, and Supabase full-stack applications instantly from text prompts.",
    website_url: "https://lovable.dev",
    logo_url: "https://www.google.com/s2/favicons?domain=lovable.dev&sz=128"
  },
  {
    name: "Bolt.new",
    slug: "bolt-new",
    category: "coding",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 97,
    ai_vault_score: 97,
    tagline: "In-browser full-stack AI development sandbox running Node.js via WebContainers.",
    overview: "Bolt.new by StackBlitz lets developers prompt, build, run, and deploy complete Next.js applications entirely in browser WebContainers without local setup.",
    description: "Bolt.new by StackBlitz lets developers prompt, build, run, and deploy complete Next.js applications entirely in browser WebContainers without local setup.",
    website_url: "https://bolt.new",
    logo_url: "https://www.google.com/s2/favicons?domain=bolt.new&sz=128"
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    category: "image",
    pricing: "Paid",
    pricing_type: "Paid",
    score: 98,
    ai_vault_score: 98,
    tagline: "Industry-leading photorealistic generative AI art and design engine.",
    overview: "Midjourney generates photorealistic visual assets, typography, and cinematic lighting scenes from natural language prompts using state-of-the-art diffusion models.",
    description: "Midjourney generates photorealistic visual assets, typography, and cinematic lighting scenes from natural language prompts using state-of-the-art diffusion models.",
    website_url: "https://www.midjourney.com",
    logo_url: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=128"
  },
  {
    name: "Perplexity AI",
    slug: "perplexity",
    category: "productivity",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 98,
    ai_vault_score: 98,
    tagline: "Conversational answer engine with cited live web sources.",
    overview: "Perplexity AI delivers real-time cited answers, structured research summaries, and interactive multi-step queries without search ad clutter.",
    description: "Perplexity AI delivers real-time cited answers, structured research summaries, and interactive multi-step queries without search ad clutter.",
    website_url: "https://www.perplexity.ai",
    logo_url: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128"
  },
  {
    name: "ElevenLabs",
    slug: "elevenlabs",
    category: "audio",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 98,
    ai_vault_score: 98,
    tagline: "Most realistic generative voice synthesis and dynamic speech AI.",
    overview: "ElevenLabs generates natural human emotional speech, instant voice cloning, and multilingual video dubbing across 29 languages with studio audio fidelity.",
    description: "ElevenLabs generates natural human emotional speech, instant voice cloning, and multilingual video dubbing across 29 languages with studio audio fidelity.",
    website_url: "https://elevenlabs.io",
    logo_url: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128"
  },
  {
    name: "Suno AI",
    slug: "suno",
    category: "audio",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 97,
    ai_vault_score: 97,
    tagline: "Create radio-quality songs with full vocals and instruments in seconds.",
    overview: "Suno turns text descriptions into complete vocal tracks, instrumental arrangements, and customized musical genres ranging from pop to rock.",
    description: "Suno turns text descriptions into complete vocal tracks, instrumental arrangements, and customized musical genres ranging from pop to rock.",
    website_url: "https://suno.com",
    logo_url: "https://www.google.com/s2/favicons?domain=suno.com&sz=128"
  },
  {
    name: "Runway Gen-3",
    slug: "runway",
    category: "video",
    pricing: "Freemium",
    pricing_type: "Freemium",
    score: 97,
    ai_vault_score: 97,
    tagline: "Next-generation generative video and motion graphics creative suite.",
    overview: "Runway Gen-3 Alpha provides fine-grained control over motion, lighting, and transitions for professional video production and marketing assets.",
    description: "Runway Gen-3 Alpha provides fine-grained control over motion, lighting, and transitions for professional video production and marketing assets.",
    website_url: "https://runwayml.com",
    logo_url: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=128"
  }
];

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Fetch 1 sample row to detect exact column names
  const { data: sampleRows, error: sampleErr } = await supabase
    .from("ai_tools")
    .select("*")
    .limit(1);

  if (sampleErr) {
    return NextResponse.json({ error: sampleErr.message }, { status: 500 });
  }

  const validColumns = new Set(sampleRows && sampleRows[0] ? Object.keys(sampleRows[0]) : []);

  const results = [];

  for (const rawTool of REAL_TRENDING_TOOLS) {
    // 2. Filter payload to ONLY include columns that exist in the database table
    const safePayload: Record<string, unknown> = {};

    Object.entries(rawTool).forEach(([k, v]) => {
      if (validColumns.size === 0 || validColumns.has(k)) {
        safePayload[k] = v;
      }
    });

    if (validColumns.has("updated_at")) {
      safePayload.updated_at = new Date().toISOString();
    }
    if (validColumns.has("created_at")) {
      safePayload.created_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("ai_tools")
      .upsert(safePayload, { onConflict: "slug" });

    results.push({
      name: rawTool.name,
      slug: rawTool.slug,
      success: !error,
      error: error?.message || null,
    });
  }

  return NextResponse.json({
    message: "Trending tools synced successfully!",
    total: REAL_TRENDING_TOOLS.length,
    results,
  });
}
