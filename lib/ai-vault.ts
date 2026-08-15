// lib/ai-vault.ts

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SITE_URL = "https://www.aivault.pp.ua";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aivault.onrender.com';

export type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;

  description?: string | null;
  short_description?: string | null;
  overview?: string | null;

  category?: string | null;

  pricing?: string | null;
  pricing_model?: string | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;
  neural_score?: number | string | null;
  rating?: number | string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  website_url?: string | null;
  official_url?: string | null;
  url?: string | null;

  features?: unknown;
  key_features?: unknown;

  use_cases?: unknown;

  limitations?: unknown;
  cons?: unknown;

  integrations?: unknown;

  operating_system?: string | null;
  os?: string | null;

  deployment?: string | null;
  license?: string | null;

  faqs?: unknown;
  faq?: unknown;

  [key: string]: unknown;
};

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key);
}

/* =========================================================
   TEXT & UTILS
========================================================= */

export function clean(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  return "";
}

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizedSlug(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCanonicalSlug(tool: ToolRecord): string {
  return clean(tool.slug);
}

export function getToolName(tool: ToolRecord): string {
  return clean(tool.name) || "AI Tool";
}

export function getToolCategory(tool: ToolRecord): string {
  return clean(tool.category) || "AI Tools";
}

/* =========================================================
   PRICING
========================================================= */

export type PricingValue =
  | "Free"
  | "Freemium"
  | "Paid"
  | "Free Trial"
  | "Contact Sales"
  | "Open Source"
  | "Enterprise"
  | "Unknown";

export function normalizePricing(value: unknown): PricingValue {
  const raw = clean(value);
  if (!raw) return "Unknown";
  const v = raw.toLowerCase();

  if (v.includes("freemium")) return "Freemium";
  if (v === "free" || v.includes("free plan") || v.includes("free to use")) return "Free";
  if (v.includes("free trial") || v.includes("trial")) return "Free Trial";
  if (v.includes("contact sales") || v.includes("contact us")) return "Contact Sales";
  if (v.includes("open source") || v.includes("opensource")) return "Open Source";
  if (v.includes("enterprise")) return "Enterprise";
  if (v.includes("paid") || v.includes("subscription") || v.includes("pro")) return "Paid";

  return "Unknown";
}

/* =========================================================
   ARRAY / JSON PARSERS
========================================================= */

export function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          return clean(obj.name) || clean(obj.title) || clean(obj.text) || clean(obj.value);
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  const text = value.trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parseArray(parsed);
    }
  } catch {
    // normal text format fallback
  }

  return text
    .split(/\r?\n|;/)
    .map((item) =>
      item
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

/* =========================================================
   CONTENT CLEANING ENGINE (Removes generic filler intros)
========================================================= */

const GENERIC_PATTERNS = [
  /senior seo/i,
  /visora ai/i,
  /professional review/i,
  /our analysis reveals/i,
  /ever-evolving landscape/i,
  /cutting-edge/i,
  /powerful features/i,
  /user-friendly interface/i,
  /excellent option/i,
  /streamline workflows/i,
  /enhance overall efficiency/i,
  /valuable tool/i,
  /robust tool/i,
  /wide range of users/i,
  /make informed decisions/i,
  /designed to help users/i,
  /pricing 2026/i,
  /best .* alternatives/i,
];

export function genericPhraseCount(text: string): number {
  return GENERIC_PATTERNS.filter((pattern) => pattern.test(text)).length;
}

export function hasGenericContent(text: string): boolean {
  return genericPhraseCount(text) > 0;
}

export function cleanCanonicalText(value: unknown): string {
  let text = clean(value);
  if (!text) return "";

  text = text.replace(/As a Senior SEO & AI Analyst for Visora AI,?\s*/gi, "");
  text = text.replace(/In this professional review,?\s*/gi, "");
  text = text.replace(/Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi, "");

  return text.replace(/\s{2,}/g, " ").trim();
}

export function getDescription(tool: ToolRecord): string {
  return (
    cleanCanonicalText(tool.description) ||
    cleanCanonicalText(tool.short_description) ||
    cleanCanonicalText(tool.overview)
  );
}

export function getOverview(tool: ToolRecord): string {
  return cleanCanonicalText(tool.overview) || getDescription(tool);
}

export function getFeatures(tool: ToolRecord): string[] {
  return parseArray(tool.key_features).length
    ? parseArray(tool.key_features)
    : parseArray(tool.features);
}

export function getUseCases(tool: ToolRecord): string[] {
  return parseArray(tool.use_cases);
}

export function getLimitations(tool: ToolRecord): string[] {
  return parseArray(tool.limitations).length
    ? parseArray(tool.limitations)
    : parseArray(tool.cons);
}

export function getIntegrations(tool: ToolRecord): string[] {
  return parseArray(tool.integrations);
}

/* =========================================================
   URL MANAGEMENT
========================================================= */

export function getWebsiteUrl(tool: ToolRecord): string | null {
  const value = clean(tool.website_url) || clean(tool.official_url) || clean(tool.url);
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  return value;
}

export function toolUrl(tool: ToolRecord): string {
  const slug = getCanonicalSlug(tool);
  if (!slug) return SITE_URL;
  return `${SITE_URL}/tool/${encodeURIComponent(slug)}`;
}

/* =========================================================
   SCORE NORMALIZATION & CALCULATION ENGINE (Strict 0-100 Format)
========================================================= */

export function normalizeScore(scoreData: any): number {
  if (scoreData === null || scoreData === undefined) return 0;
  
  let rawScore = typeof scoreData === 'object' 
    ? (scoreData.score ?? scoreData.ai_vault_score ?? scoreData.neural_score ?? scoreData.rating ?? 0) 
    : Number(scoreData);
  
  if (isNaN(rawScore)) return 0;

  // If score is given on a legacy 0-10 scale, convert to 0-100 format
  if (rawScore > 0 && rawScore <= 10) {
    return Math.round(rawScore * 10);
  }

  return Math.min(Math.max(Math.round(rawScore), 0), 100);
}

export function formatAIScore(score: any): string {
  const normalized = normalizeScore(score);
  if (normalized <= 0) return 'N/A';
  return `${normalized}/100`;
}

export function getScoreBarWidth(score: any): string {
  const normalized = normalizeScore(score);
  return `${normalized}%`;
}

export function calculateAiVaultScore(tool: ToolRecord): number {
  const existingScore = tool.score ?? tool.ai_vault_score ?? tool.neural_score;
  if (existingScore !== null && existingScore !== undefined) {
    const normalized = normalizeScore(existingScore);
    if (normalized > 0) return normalized;
  }

  const description = getDescription(tool);
  const features = getFeatures(tool);
  const useCases = getUseCases(tool);
  const integrations = getIntegrations(tool);

  let score = 0;

  if (description.length >= 120) score += 20;
  else if (description.length >= 60) score += 12;
  else if (description.length > 0) score += 6;

  if (description && !hasGenericContent(description)) score += 15;

  if (features.length >= 5) score += 15;
  else if (features.length >= 2) score += 10;
  else if (features.length === 1) score += 5;

  if (useCases.length >= 3) score += 10;
  else if (useCases.length > 0) score += 6;

  if (normalizePricing(tool.pricing_model || tool.pricing) !== "Unknown") score += 10;

  if (clean(tool.operating_system) || clean(tool.os) || clean(tool.deployment)) score += 10;

  if (integrations.length) score += 5;

  const rating = Number(tool.rating);
  if (Number.isFinite(rating) && rating > 0) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getAiVaultScore(tool: ToolRecord): number {
  return calculateAiVaultScore(tool);
}

/* =========================================================
   SEO UTILITIES
========================================================= */

export function getSeoTitle(tool: ToolRecord): string {
  const name = getToolName(tool);
  return `${name} — Features, Pricing, Use Cases & Alternatives | AI Vault`;
}

export function getSeoDescription(tool: ToolRecord): string {
  const name = getToolName(tool);
  const category = getToolCategory(tool);
  const description = getDescription(tool);
  const short = description.length > 110 ? `${description.slice(0, 107)}...` : description;

  if (short) {
    return `${short} Explore verified ${category.toLowerCase()} information, pricing, features and alternatives on AI Vault.`;
  }

  return `Explore ${name}, a ${category.toLowerCase()} tool. View verified information, pricing, features, use cases and alternatives on AI Vault.`;
}

const CATEGORY_COPY: Record<string, string> = {
  productivity: "Explore productivity software for task management, workflow automation, organization, note-taking and everyday work efficiency.",
  marketing: "Explore marketing platforms for SEO, content creation, advertising, analytics, lead generation and campaign workflows.",
  chatbot: "Explore chatbot and conversational AI software for customer support, assistants, knowledge access and automated conversations.",
  coding: "Explore developer and coding tools for software development, debugging, code generation, testing and engineering workflows.",
  image: "Explore image and visual AI tools for generation, editing, design, enhancement and creative production.",
  writing: "Explore writing software for drafting, editing, rewriting, research assistance, content production and communication.",
  audio: "Explore audio tools for speech, transcription, voice generation, sound editing and audio production.",
  video: "Explore video tools for generation, editing, production, subtitles, animation and video workflows.",
};

export function getCategoryDescription(category: string): string {
  const key = normalizedSlug(category);
  return CATEGORY_COPY[key] || `Explore verified ${category} software and tools, with practical information about their capabilities, pricing and use cases.`;
}

/* =========================================================
   CENTRAL API FETCH & BACKEND WRAPPERS
========================================================= */

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`API Fetch Failed [${endpoint}]:`, error);
    return null;
  }
}

export async function getTools(params: string = '') {
  return await fetchAPI(`/api/tools?${params}`);
}

export async function fetchToolBySlugFromBackend(slug: string) {
  return await fetchAPI(`/api/tools/${slug}`);
}

export async function getRecommendations(query: string) {
  return await fetchAPI(`/api/recommendations/search?q=${encodeURIComponent(query)}`);
}

export async function getDecision(payload: any) {
  return await fetchAPI('/api/decision/decide', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAutopilotStatus() {
  return await fetchAPI('/api/autopilot/status');
}

export async function triggerAutopilotRun() {
  return await fetchAPI('/api/autopilot/run-now', {
    method: 'POST',
  });
}

/* =========================================================
   DATABASE DATABASE QUERIES (Supabase Fallback / Direct)
========================================================= */

export async function getToolBySlug(slug: string): Promise<ToolRecord | null> {
  const supabase = getSupabase();
  const canonicalSlug = safeDecode(slug);

  if (!canonicalSlug) return null;

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .eq("slug", canonicalSlug)
    .maybeSingle();

  if (error) {
    console.error("[AI_VAULT_TOOL_LOOKUP]", error);
    throw new Error(error.message);
  }

  return data ? (data as ToolRecord) : null;
}

export async function getToolCount(): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("ai_tools")
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getCategoryCount(category: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("ai_tools")
    .select("id", { count: "exact", head: true })
    .ilike("category", category);

  if (error) throw new Error(error.message);
  return count || 0;
}
