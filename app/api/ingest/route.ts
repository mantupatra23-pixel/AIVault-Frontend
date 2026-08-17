// app/api/ingest/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

interface GeneratedTool {
  name: string;
  category: string;
  pricing: string;
  overview: string;
  website_url: string;
}

const CATEGORIES = [
  "Productivity",
  "Coding",
  "Marketing",
  "Image",
  "Audio",
  "Writing",
  "Video",
  "Chatbot",
];

const PRICING_OPTIONS = ["Free", "Freemium", "Paid"];

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
  return 85 + (hash % 13); // 85 to 97 score range
}

// 1. Generate via Gemini API (Native fetch - no extra package needed)
async function generateWithGemini(existingList: string): Promise<GeneratedTool[]> {
  if (!GEMINI_API_KEY) return [];

  const prompt = `Generate exactly 10 realistic, newly launched AI tools that are completely unique and NOT in this list: [${existingList}].
Return ONLY a valid JSON array of objects with keys:
"name" (catchy AI product name),
"category" (choose one from: ${CATEGORIES.join(", ")}),
"pricing" (choose one from: ${PRICING_OPTIONS.join(", ")}),
"overview" (2-3 detailed sentences describing the product capabilities),
"website_url" (valid domain format, e.g. https://example.ai).
Do NOT include markdown formatting or code backticks, return raw JSON array only.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    text = text.replace(/^```json/g, "").replace(/```$/g, "").trim();
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// 2. Generate via Groq API fallback
async function generateWithGroq(existingList: string): Promise<GeneratedTool[]> {
  if (!GROQ_API_KEY) return [];

  const prompt = `Generate exactly 10 realistic, newly launched AI tools that are completely unique and NOT in this list: [${existingList}].
Return ONLY a valid JSON array of objects with keys: "name", "category" (from: ${CATEGORIES.join(", ")}), "pricing" (from: ${PRICING_OPTIONS.join(", ")}), "overview", "website_url". Raw JSON array only.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.tools || [];
  } catch {
    return [];
  }
}

// 3. Procedural Unique AI Generator (Guarantee: Always generates 10 unique tools)
function generateProceduralBatch(existingSlugs: Set<string>): GeneratedTool[] {
  const prefixes = [
    "Neural", "Apex", "Hyper", "Synapse", "Quantum", "Nexus", "Pulse", "Omni",
    "Flow", "Vector", "Optima", "Deep", "Cogni", "Aura", "Prism", "Kite", "Zeta"
  ];
  const suffixes = [
    "Mind", "Forge", "Studio", "Craft", "Scale", "Stack", "Engine", "Pulse",
    "Logic", "Matrix", "Pilot", "Scribe", "Lens", "Desk", "Wave", "Hub", "Node"
  ];

  const tools: GeneratedTool[] = [];
  let attempts = 0;

  while (tools.length < 10 && attempts < 100) {
    attempts++;
    const pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${pre}${suf} AI`;
    const slug = generateSlug(name);

    if (existingSlugs.has(slug) || tools.some((t) => generateSlug(t.name) === slug)) {
      continue;
    }

    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const pricing = PRICING_OPTIONS[Math.floor(Math.random() * PRICING_OPTIONS.length)];

    tools.push({
      name,
      category: cat,
      pricing,
      overview: `${name} is an enterprise-grade AI solution designed for high-performance ${cat.toLowerCase()} workflows with real-time autonomous processing.`,
      website_url: `https://${slug.replace(/-ai$/, "")}.ai`,
    });
  }

  return tools;
}

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: "Supabase credentials missing." },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Existing slugs aur names fetch karein taaki duplicate na bane
  const { data: existingData } = await supabase
    .from("ai_tools")
    .select("slug, name")
    .limit(1000);

  const existingSlugs = new Set((existingData || []).map((t) => t.slug));
  const existingNamesStr = (existingData || []).slice(0, 40).map((t) => t.name).join(", ");

  // AI Generation sequence (Gemini -> Groq -> Procedural Engine)
  let batch: GeneratedTool[] = await generateWithGemini(existingNamesStr);

  if (!batch || batch.length < 10) {
    batch = await generateWithGroq(existingNamesStr);
  }

  if (!batch || batch.length < 10) {
    batch = generateProceduralBatch(existingSlugs);
  }

  const results = [];

  for (const item of batch) {
    let slug = generateSlug(item.name);

    // Slug collision protection
    if (existingSlugs.has(slug)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const score = calculateDeterministicScore(item.name);

    const payload = {
      name: item.name,
      slug,
      category: item.category || "Productivity",
      pricing: item.pricing || "Freemium",
      description: item.overview,
      overview: item.overview,
      score,
      website_url: item.website_url,
    };

    const { error } = await supabase.from("ai_tools").insert(payload);

    if (error) {
      results.push({
        name: item.name,
        slug,
        status: "error",
        message: error.message,
      });
    } else {
      existingSlugs.add(slug);
      results.push({
        name: item.name,
        slug,
        category: item.category,
        status: "success",
        score,
      });
    }
  }

  return NextResponse.json({
    success: true,
    new_tools_added: results.filter((r) => r.status === "success").length,
    tools: results,
  });
}

export async function POST() {
  return GET();
}
