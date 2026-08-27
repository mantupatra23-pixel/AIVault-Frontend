import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REAL_TRENDING_TOOLS = [
  {
    name: "DeepSeek",
    slug: "deepseek",
    category: "coding",
    pricing_model: "Freemium",
    score: 98,
    tagline: "Open-source reasoning model rivaling frontier LLMs at 10x lower cost.",
    overview: "DeepSeek is an advanced open-source AI platform featuring DeepSeek-V3 and DeepSeek-R1 reasoning architectures for programming, mathematics, and multi-step logic.",
    features: ["Reasoning & Thinking Tokens", "Full OpenAI-Compatible API", "Ultra-Low Cost Inference"],
    website_url: "https://www.deepseek.com",
    logo_url: "https://www.google.com/s2/favicons?domain=deepseek.com&sz=128"
  },
  {
    name: "Cursor",
    slug: "cursor",
    category: "coding",
    pricing_model: "Freemium",
    score: 97,
    tagline: "The AI-first code editor built for hyper-productive software engineering.",
    overview: "Cursor is a fork of VS Code supercharged with Claude 3.5 Sonnet and GPT-4o, allowing full codebase indexing, multi-file editing, and inline terminal debugging.",
    features: ["Full Repo Semantic Indexing", "Multi-File Composer Mode", "Terminal Command Autofix"],
    website_url: "https://www.cursor.com",
    logo_url: "https://www.google.com/s2/favicons?domain=cursor.com&sz=128"
  },
  {
    name: "Lovable",
    slug: "lovable",
    category: "coding",
    pricing_model: "Freemium",
    score: 96,
    tagline: "Build full-stack production web apps directly from plain English prompts.",
    overview: "Lovable AI acts as an autonomous engineer that builds, debugs, and deploys full React, Tailwind, and Supabase full-stack applications instantly from text prompts.",
    features: ["Instant Full-Stack Deployment", "Supabase Backend Auto-Setup", "One-Click GitHub Sync"],
    website_url: "https://lovable.dev",
    logo_url: "https://www.google.com/s2/favicons?domain=lovable.dev&sz=128"
  },
  {
    name: "Bolt.new",
    slug: "bolt-new",
    category: "coding",
    pricing_model: "Freemium",
    score: 95,
    tagline: "In-browser full-stack AI development sandbox running Node.js via WebContainers.",
    overview: "Bolt.new by StackBlitz lets developers prompt, build, run, and deploy complete Next.js and Vite applications entirely in browser WebContainers without local setup.",
    features: ["In-Browser Node.js Execution", "Direct npm Package Installation", "Live WebContainer Sandbox"],
    website_url: "https://bolt.new",
    logo_url: "https://www.google.com/s2/favicons?domain=bolt.new&sz=128"
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    category: "image",
    pricing_model: "Paid",
    score: 97,
    tagline: "Industry-leading photorealistic generative AI art and design engine.",
    overview: "Midjourney generates photorealistic visual assets, typography, and cinematic lighting scenes from natural language prompts using state-of-the-art diffusion models.",
    features: ["Ultra-Realistic Lighting & Textures", "Web & Discord Creation Canvas", "Inpainting & Character Consistency"],
    website_url: "https://www.midjourney.com",
    logo_url: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=128"
  },
  {
    name: "Flux.1",
    slug: "flux-ai",
    category: "image",
    pricing_model: "Freemium",
    score: 96,
    tagline: "Black Forest Labs open-weight text-to-image foundation model.",
    overview: "Flux.1 delivers sharp text typography rendering, complex human anatomy coherence, and visual prompt accuracy across Schnell, Dev, and Pro checkpoints.",
    features: ["Precise Text Typography Rendering", "Open-Weights Local Execution", "Commercial High-Resolution API"],
    website_url: "https://blackforestlabs.ai",
    logo_url: "https://www.google.com/s2/favicons?domain=blackforestlabs.ai&sz=128"
  },
  {
    name: "Kling AI",
    slug: "kling-ai",
    category: "video",
    pricing_model: "Freemium",
    score: 95,
    tagline: "High-definition cinematic text-to-video generation with realistic physical dynamics.",
    overview: "Kling AI produces 1080p 60fps cinematic video clips with complex physics simulation, camera motion controls, and consistent multi-shot keyframing.",
    features: ["3D Physics Simulation", "Full Camera Motion Paths", "1080p Cinematic Video Rendering"],
    website_url: "https://klingai.com",
    logo_url: "https://www.google.com/s2/favicons?domain=klingai.com&sz=128"
  },
  {
    name: "Runway Gen-3",
    slug: "runway",
    category: "video",
    pricing_model: "Freemium",
    score: 96,
    tagline: "Next-generation generative video and motion graphics creative suite.",
    overview: "Runway Gen-3 Alpha provides fine-grained control over motion, lighting, and transitions for Hollywood-grade visual production and advertising assets.",
    features: ["Motion Brush Fine Control", "Camera Angle Direction", "4K Video Upscaling"],
    website_url: "https://runwayml.com",
    logo_url: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=128"
  },
  {
    name: "Suno AI",
    slug: "suno",
    category: "audio",
    pricing_model: "Freemium",
    score: 96,
    tagline: "Create radio-quality songs with full vocals and instruments in seconds.",
    overview: "Suno turns text descriptions into complete vocal tracks, instrumental arrangements, and customized musical genres ranging from pop to electronic rock.",
    features: ["Full Vocal Synthesis", "Multi-Genre Instrumentals", "Stem Audio Exporting"],
    website_url: "https://suno.com",
    logo_url: "https://www.google.com/s2/favicons?domain=suno.com&sz=128"
  },
  {
    name: "ElevenLabs",
    slug: "elevenlabs",
    category: "audio",
    pricing_model: "Freemium",
    score: 97,
    tagline: "Most realistic generative voice synthesis and dynamic speech AI.",
    overview: "ElevenLabs generates natural human emotional speech, instant voice cloning, and multilingual video dubbing across 29 languages with studio audio fidelity.",
    features: ["Instant Zero-Shot Voice Cloning", "Multilingual Automatic Dubbing", "Conversational Low-Latency Agent API"],
    website_url: "https://elevenlabs.io",
    logo_url: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128"
  },
  {
    name: "Perplexity AI",
    slug: "perplexity",
    category: "productivity",
    pricing_model: "Freemium",
    score: 98,
    tagline: "Conversational answer engine with cited live web sources.",
    overview: "Perplexity AI delivers real-time cited answers, structured research summaries, and interactive multi-step queries without ad-heavy search clutter.",
    features: ["Real-Time Source Citations", "Pro Multi-Model Research", "Claude & GPT-4 Switching"],
    website_url: "https://www.perplexity.ai",
    logo_url: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128"
  },
  {
    name: "Claude 3.5 Sonnet",
    slug: "claude",
    category: "chatbot",
    pricing_model: "Freemium",
    score: 99,
    tagline: "Anthropic flagship model leading coding, nuance, and visual reasoning.",
    overview: "Claude 3.5 Sonnet offers frontier intelligence for complex reasoning, artifact rendering, and autonomous software development with a 200K token context window.",
    features: ["Interactive Artifacts Canvas", "200K Long Context Window", "Frontier Coding & Math Benchmarks"],
    website_url: "https://claude.ai",
    logo_url: "https://www.google.com/s2/favicons?domain=anthropic.com&sz=128"
  }
];

async function seed() {
  console.log(`🚀 Seeding ${REAL_TRENDING_TOOLS.length} high-search-volume real tools into Supabase...`);
  
  for (const tool of REAL_TRENDING_TOOLS) {
    const { error } = await supabase
      .from("ai_tools")
      .upsert({ ...tool, updated_at: new Date().toISOString() }, { onConflict: "slug" });
    
    if (error) {
      console.error(`❌ Failed on ${tool.name}:`, error.message);
    } else {
      console.log(`✅ Upserted: ${tool.name} (${tool.slug})`);
    }
  }
  
  console.log("🎉 Seeding complete! Real tools are now live.");
}

seed();
