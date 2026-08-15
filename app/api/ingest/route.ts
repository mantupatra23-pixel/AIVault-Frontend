// app/api/ingest/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

interface RawToolCandidate {
  name: string;
  category: string;
  pricing: string;
  overview: string;
  website_url: string;
}

const DAILY_BATCH: RawToolCandidate[] = [
  {
    name: "DocuSynth AI",
    category: "Productivity",
    pricing: "Freemium",
    overview:
      "DocuSynth AI automates document comprehension, structured summarization, and table extraction for enterprise workflows.",
    website_url: "https://docusynth.ai",
  },
  {
    name: "PromptEngine Pro",
    category: "Coding",
    pricing: "Paid",
    overview:
      "PromptEngine Pro provides testing, latency benchmarking, and version control for production LLM prompt pipelines.",
    website_url: "https://promptengine.pro",
  },
  {
    name: "AudiencePulse",
    category: "Marketing",
    pricing: "Freemium",
    overview:
      "AudiencePulse monitors customer sentiment across social channels and generates automated response recommendations.",
    website_url: "https://audiencepulse.io",
  },
  {
    name: "VisionGrid 3D",
    category: "Image",
    pricing: "Paid",
    overview:
      "VisionGrid 3D converts 2D raster assets and concept sketches into textured 3D mesh models in real time.",
    website_url: "https://visiongrid3d.com",
  },
  {
    name: "VoiceCraft Studio",
    category: "Audio",
    pricing: "Freemium",
    overview:
      "VoiceCraft Studio delivers expressive voice cloning and multi-lingual voiceover generation with instant timeline export.",
    website_url: "https://voicecraft.studio",
  },
  {
    name: "ScriptFlow AI",
    category: "Writing",
    pricing: "Freemium",
    overview:
      "ScriptFlow AI analyzes narrative rhythm and story structure to suggest real-time line polish for screenwriters and authors.",
    website_url: "https://scriptflow.ai",
  },
  {
    name: "CodePulse Radar",
    category: "Coding",
    pricing: "Free",
    overview:
      "CodePulse Radar scans GitHub repositories for vulnerability exposure, outdated dependencies, and licensing conflicts.",
    website_url: "https://codepulse.dev",
  },
  {
    name: "CastFrame AI",
    category: "Video",
    pricing: "Paid",
    overview:
      "CastFrame AI streamlines video background replacement, auto-reframe for mobile aspect ratios, and smart cut generation.",
    website_url: "https://castframe.ai",
  },
  {
    name: "BotScribe Live",
    category: "Chatbot",
    pricing: "Freemium",
    overview:
      "BotScribe Live deploys multi-lingual customer care chatbots with continuous knowledge base retrieval augmented generation.",
    website_url: "https://botscribe.live",
  },
  {
    name: "LeadNova AI",
    category: "Marketing",
    pricing: "Paid",
    overview:
      "LeadNova AI identifies high-intent B2B prospect accounts and writes contextual personalized opening icebreakers.",
    website_url: "https://leadnova.ai",
  },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function calculateDeterministicScore(name: string): number {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 82 + (hash % 14);
}

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: "Supabase environment variables missing on Vercel." },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const results = [];

  for (const item of DAILY_BATCH) {
    const slug = generateSlug(item.name);
    const score = calculateDeterministicScore(item.name);

    const payload = {
      name: item.name,
      slug,
      category: item.category,
      pricing: item.pricing,
      pricing_model: item.pricing,
      description: item.overview,
      overview: item.overview,
      score,
      ai_vault_score: score,
      neural_score: score,
      website_url: item.website_url,
      is_verified: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("ai_tools")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      results.push({
        name: item.name,
        status: "error",
        message: error.message,
      });
    } else {
      results.push({ name: item.name, status: "success", score, slug });
    }
  }

  return NextResponse.json({
    success: true,
    total_ingested: results.filter((r) => r.status === "success").length,
    tools: results,
  });
}
