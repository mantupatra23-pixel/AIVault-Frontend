import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

// 🟢 NEXT.JS COOLDOWN BYPASS (Yeh line Vercel ko XML dynamic generation force karegi)
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Database structures validation types definition
interface ToolDataRow {
  slug: string;
  created_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aivault.pp.ua"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // FETCH ALL VERIFIED TARGET NODE SLUGS FROM TABLE
  const { data: tools } = await supabase
    .from("ai_tools")
    .select("slug, created_at")

  const typedTools = (tools as unknown as ToolDataRow[]) || [];

  const toolEntries = typedTools.map((tool) => ({
    url: `${baseUrl}/tool/${tool.slug}`,
    lastModified: tool.created_at
      ? new Date(tool.created_at).toISOString()
      : new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

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
