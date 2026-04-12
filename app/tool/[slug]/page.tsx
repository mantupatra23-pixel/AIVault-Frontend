import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: tool } = await supabase.from('ai_tools').select('*').eq('slug', slug).single()
  if (!tool) return notFound()

  const { data: related } = await supabase.from('ai_tools').select('name, slug, category, pricing, score').eq('category', tool.category).neq('slug', slug).limit(4)

  const finalUrl = tool.affiliate_url || tool.website_url

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-20 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 CLEAN NAVIGATION */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link href="/" className="font-black text-xl tracking-tighter italic">VISORA<span className="text-blue-600">.</span></Link>
            <a href={finalUrl} target="_blank" className="bg-black text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">Direct Access ↗</a>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        
        {/* 🏆 HEADER SECTION */}
        <header className="pt-20 pb-12 border-b border-slate-50 mb-12">
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded uppercase tracking-widest">{tool.category}</span>
                <span className="text-slate-300 font-bold text-xs">/</span>
                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest italic">Score: {tool.score || 85}/100</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-[1000] tracking-tighter leading-none mb-8 uppercase italic">{tool.name}<span className="text-blue-600">.</span></h1>
            
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100/50">
                <h3 className="text-blue-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4">The Strategic Value</h3>
                <p className="text-xl md:text-2xl font-bold leading-tight italic">"{tool.description?.split('.')[0]}."</p>
            </div>
        </header>

        {/* 🧬 CONTENT GRID */}
        <div className="space-y-20">
            
            {/* VIDEO PLAYER */}
            {tool.youtube_id && (
                <div className="rounded-[2.5rem] overflow-hidden bg-slate-100 aspect-video shadow-inner">
                    <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Visora Tutorial" frameBorder="0" allowFullScreen></iframe>
                </div>
            )}

            {/* FULL ANALYSIS */}
            <section className="max-w-3xl">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 mb-8 underline decoration-slate-200 underline-offset-8">Neural Insight</h2>
                <div className="text-lg text-slate-500 font-medium leading-[1.8] space-y-8">
                    {tool.description?.split('\n').map((para: string, i: number) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>
            </section>

            {/* QUICK VERDICT (PROS/CONS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50/50 p-10 rounded-[2.5rem] border border-green-100">
                    <h4 className="text-green-600 text-[9px] font-black uppercase tracking-widest mb-4">✓ Strengths</h4>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{tool.pros_cons?.split('Cons:')[0] || "Efficiency & Speed."}</p>
                </div>
                <div className="bg-red-50/50 p-10 rounded-[2.5rem] border border-red-100">
                    <h4 className="text-red-600 text-[9px] font-black uppercase tracking-widest mb-4">✕ Friction</h4>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{tool.pros_cons?.split('Cons:')[1] || "Setup time required."}</p>
                </div>
            </div>

            {/* CTA SECTION */}
            <section className="bg-slate-50 p-12 rounded-[3rem] text-center border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4 italic">Ready to Execute?</div>
                <div className="text-3xl font-[1000] text-slate-900 uppercase italic mb-8">Access: {tool.pricing}</div>
                <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all">Visit {tool.name} Interface ↗</a>
                <p className="mt-6 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Verified by Mantu Patra • Founder & CEO</p>
            </section>
        </div>

        {/* RELATED ALTERNATIVES */}
        <section className="mt-32 pt-20 border-t border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-10">Neural Cluster Discovery</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-6 rounded-3xl border border-slate-50 hover:border-blue-600 transition-all bg-white hover:shadow-xl">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-md font-black mt-2 group-hover:text-blue-600 italic uppercase leading-none">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="text-center mt-32 py-10 opacity-10 text-[8px] font-black uppercase tracking-[1em]">
        VISORA AI ENGINE • REVOLUTIONIZING BHARAT
      </footer>
    </main>
  )
}
