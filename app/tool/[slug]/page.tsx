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
      
      {/* 🧭 SINGLE MODERN NAVIGATION (FIXED) */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link href="/" className="font-black text-2xl tracking-tighter italic uppercase">VISORA<span className="text-blue-600">.</span></Link>
            <div className="flex items-center gap-6">
                <Link href="/" className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Directory</Link>
                <a href={finalUrl} target="_blank" className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">Execute ↗</a>
            </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        
        {/* 🏆 HEADER BLOCK */}
        <header className="pt-20 pb-12 mb-12 border-b border-slate-50">
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-widest">{tool.category}</span>
                <span className="text-slate-300 font-bold">/</span>
                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest italic">Visora Score: {tool.score || 85}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-[1000] tracking-tighter leading-none mb-10 uppercase italic">{tool.name}<span className="text-blue-600">.</span></h1>
            
            <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl shadow-blue-100/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl font-black italic">"</div>
                <h3 className="text-blue-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4">Strategic Summary</h3>
                <p className="text-xl md:text-2xl font-bold leading-tight italic relative z-10">"{tool.description?.split('.')[0]}."</p>
            </div>
        </header>

        {/* 🧬 ANALYSIS SECTIONS */}
        <div className="space-y-24">
            
            {/* VIDEO PLAYER */}
            {tool.youtube_id && (
                <div className="rounded-[3rem] overflow-hidden bg-slate-50 aspect-video shadow-2xl shadow-slate-100 border-8 border-white">
                    <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Visora Intelligence" frameBorder="0" allowFullScreen></iframe>
                </div>
            )}

            {/* DEEP DIVE */}
            <section className="max-w-3xl">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 mb-10 underline decoration-slate-200 underline-offset-8 italic">Neural Insights</h2>
                <div className="text-lg text-slate-500 font-medium leading-[1.8] space-y-8">
                    {tool.description?.split('\n').map((para: string, i: number) => (
                        <p key={i} className="hover:text-slate-900 transition-colors">{para}</p>
                    ))}
                </div>
            </section>

            {/* ❓ Q&A / FAQ SECTION (NEW) */}
            <section className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 italic">Intelligence Q&A</h2>
                <div className="space-y-8">
                    {[
                        { q: `What is the primary use of ${tool.name}?`, a: `It is specifically designed for ${tool.category} automation and workflow optimization.` },
                        { q: `Is ${tool.name} free to use?`, a: `The current pricing model is ${tool.pricing}. Always check the official site for the latest tiers.` },
                        { q: `Does Visora recommend ${tool.name}?`, a: `With a Neural Score of ${tool.score}/100, we consider it a high-performance entity for your tech stack.` }
                    ].map((faq, i) => (
                        <div key={i} className="group border-b border-slate-200 pb-6 last:border-0">
                            <h4 className="font-black text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors italic">Q: {faq.q}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA BLOCK */}
            <section className="bg-white border-2 border-slate-100 p-12 rounded-[3.5rem] text-center shadow-xl shadow-slate-100/50">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4 italic italic">Ready for Deployment</div>
                <div className="text-4xl font-[1000] text-slate-900 uppercase italic mb-8">Status: {tool.pricing}</div>
                <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">Visit {tool.name} Interface ↗</a>
                <p className="mt-8 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Verified by Mantu Patra • Founder @ Visora AI</p>
            </section>
        </div>

        {/* RELATED CLUSTER */}
        <section className="mt-40 pt-20 border-t border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-12 italic">Neural Alternatives</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-8 rounded-[2rem] border border-slate-100 hover:border-blue-600 transition-all bg-white hover:shadow-2xl hover:-translate-y-2">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-md font-black mt-3 group-hover:text-blue-600 italic uppercase leading-tight tracking-tighter">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="text-center mt-32 py-12 opacity-10 text-[8px] font-black uppercase tracking-[1em] border-t border-slate-50">
        VISORA AI ENGINE • BHARAT MISSION 2026
      </footer>
    </main>
  )
}
