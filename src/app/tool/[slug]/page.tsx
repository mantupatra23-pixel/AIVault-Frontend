import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: { slug: string } }) {
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!tool) return <div className="p-10 text-center">Tool not found in Vault!</div>

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <header className="border-b pb-6">
        <h1 className="text-5xl font-extrabold text-gray-900">{tool.name}</h1>
        <p className="mt-2 text-blue-600 font-medium uppercase tracking-wider">{tool.category}</p>
      </header>
      
      <div className="mt-10 leading-relaxed text-gray-700 text-lg whitespace-pre-wrap">
        {tool.description}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center">
        <h3 className="text-xl font-bold mb-4">Ready to try {tool.name}?</h3>
        <a href={tool.affiliate_url} target="_blank" className="inline-block bg-black text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
          Visit Official Website
        </a>
      </div>
    </div>
  )
}
