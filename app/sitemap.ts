import { createClient } from '@supabase/supabase-js'

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: tools } = await supabase.from('ai_tools').select('slug, created_at')

  const toolEntries = tools?.map((tool) => ({
    url: `https://ai-vault-frontend-blue.vercel.app/tool/${tool.slug}`,
    lastModified: new Date(tool.created_at),
  })) || []

  return [
    { url: 'https://ai-vault-frontend-blue.vercel.app/', lastModified: new Date() },
    ...toolEntries,
  ]
}
