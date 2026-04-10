import { createClient } from '@supabase/supabase-js'

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Saare tools ke slugs mangwao
  const { data: tools } = await supabase.from('ai_tools').select('slug, created_at')

  const toolEntries = tools?.map((tool) => ({
    url: `https://ai-vault-frontend-blue.vercel.app/tool/${tool.slug}`,
    lastModified: new Date(tool.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  })) || []

  return [
    {
      url: 'https://ai-vault-frontend-blue.vercel.app/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...toolEntries,
  ]
}
