import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

// 🟢 Vercel pipeline aur Next.js ko strictly target dynamic response par force karega
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
