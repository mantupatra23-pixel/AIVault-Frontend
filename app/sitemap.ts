import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aivault.pp.ua"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // FETCH ALL VERIFIED TARGET NODE SLUGS FROM TABLE
  const { data: tools } = await supabase
    .from("ai_tools")
    .select("slug, created_at")

  const toolEntries = (tools || []).map((tool: any) => ({
    url: `${baseUrl}/tool/${tool.slug}`,
    lastModified: tool.created_at
      ? new Date(tool.created_at)
      : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...toolEntries,
  ]
}
