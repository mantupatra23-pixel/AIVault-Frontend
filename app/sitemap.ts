import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

// Next.js ko strictly target dynamic live response par force karega
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ToolDataRow {
  slug: string;
  created_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aivault.pp.ua"

  // 🟢 SAFE ENVIRONMENT VARIABLES CHECK
  // Agar Vercel build time par keys na milein, toh dummy string use karega taaki build fail na ho
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-url.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key"

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  let toolEntries: any[] = []

  try {
    // FETCH ALL VERIFIED TARGET NODE SLUGS FROM TABLE
    const { data: tools, error } = await supabase
      .from("ai_tools")
      .select("slug, created_at")

    if (!error && tools && Array.isArray(tools)) {
      const typedTools = tools as unknown as ToolDataRow[]
      
      toolEntries = typedTools.map((tool) => ({
        url: `${baseUrl}/tool/${tool.slug}`,
        lastModified: tool.created_at
          ? new Date(tool.created_at).toISOString()
          : new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    }
  } catch (err) {
    console.error("Vercel Build-time Supabase Fetch Bypassed:", err)
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...toolEntries,
  ]
}
