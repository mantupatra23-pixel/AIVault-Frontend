import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function FooterIndex() {
  const { data: tools } = await supabase.from('ai_tools').select('name, slug').limit(100)

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-50 opacity-20 hover:opacity-100 transition-opacity">
      <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-8">Neural Sitemap Index</h3>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {tools?.map((t) => (
          <Link key={t.slug} href={`/tool/${t.slug}`} className="text-[9px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-tighter">
            {t.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
