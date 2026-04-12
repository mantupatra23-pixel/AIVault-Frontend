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

  const { data: related } = await supabase.from('ai_tools').select('name, slug, category').eq('category', tool.category).neq('slug', slug).limit(4)

  const finalUrl = tool.affiliate_url || tool.website_url

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans">
      
      {/* 🧭 PREMIUM NAVIGATION */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link href="/" className="group flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg group-hover:rotate-12 transition-transform">V</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">Directory</span>
            </Link>
            <a href={finalUrl} target="_blank" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-black transition-all">Get Started ↗</a>
        </div>
      </nav>

      <article className="max-w-7xl mx-auto px-6 pt-16">
        
        {/* 🏆 HEADER BLOCK (FUTUREPEDIA STYLE) */}
        <div className="flex flex-col md:flex-row gap-12 mb-16 items-start">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest border border-slate-200">{tool.category}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Updated April 2026</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-[1000] tracking-tighter leading-none text-slate-900 mb-6 italic uppercase">{tool.name}<span className="text-blue-600">.</span></h1>
                <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">{tool.description?.split('\n')[0]}</p>
            </div>
            
            {/* RATING BREAKDOWN GRID */}
            <div className="w-full md:w-80 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="text-center mb-6">
                    <div className="text-5xl font-[1000] text-blue-600 italic leading-none">{tool.score || 85}<span className="text-sm text-slate-300">/100</span></div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Visora Rating</div>
                </div>
                <div className="space-y-4">
                    {[
                        { l: "Accuracy", v: "w-[92%]", c: "bg-green-500" },
                        { l: "Efficiency", v: "w-[85%]", c: "bg-blue-500" },
                        { l: "Ease of Use", v: "w-[78%]", c: "bg-purple-500" }
                    ].map((item, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 mb-1">
                                <span>{item.l}</span>
                                <span>{item.v.replace('w-[', '').replace('%]', '')}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${item.c} ${item.v} rounded-full`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 📽️ SMART PLAYER SECTION */}
        {tool.youtube_id && (
            <div className="mb-20 rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-50 border-8 border-white bg-slate-900 aspect-video">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Tutorial" frameBorder="0" allowFullScreen></iframe>
            </div>
        )}

        {/* 🧬 DUAL CONTENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-32">
            <div className="lg:col-span-2 space-y-16">
                
                {/* WHAT IS THIS? SECTION */}
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-8 border-b-4 border-blue-600 inline-block">What is {tool.name}?</h2>
                    <div className="text-lg text-slate-600 leading-[1.8] space-y-6">
                        {tool.description?.split('\n').map((para: string, i: number) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </section>

                {/* PROS & CONS GRID */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-10 rounded-[2.5rem] border border-green-100">
                        <h3 className="text-green-600 text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                            <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-[8px]">✓</span> The Pros
                        </h3>
                        <ul className="text-sm text-slate-600 font-bold space-y-4">
                            {tool.pros_cons?.split('Cons:')[0]?.split('\n').map((li: string, i: number) => (
                                <li key={i} className="flex gap-2"><span>•</span> {li}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-red-50 p-10 rounded-[2.5rem] border border-red-100">
                        <h3 className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                            <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">✕</span> The Cons
                        </h3>
                        <ul className="text-sm text-slate-600 font-bold space-y-4">
                            {tool.pros_cons?.split('Cons:')[1]?.split('\n').map((li: string, i: number) => (
                                <li key={i} className="flex gap-2"><span>•</span> {li}</li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>

            {/* 💰 CTA SIDEBAR (FUTUREPEDIA STYLE) */}
            <aside>
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm sticky top-32 space-y-6">
                    <div className="text-center pb-6 border-b border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pricing Model</div>
                        <div className="text-2xl font-black text-slate-900 uppercase italic">{tool.pricing}</div>
                    </div>
                    <a href={finalUrl} target="_blank" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center block hover:bg-blue-600 transition-all shadow-xl">Visit {tool.name} Website ↗</a>
                    <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">Verified by Visora Executive Engine. Clicks generate neural data.</p>
                </div>
            </aside>
        </div>

        {/* 🌐 RELATED DISCOVERY */}
        <section className="pt-20 border-t border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-12">Related Alternatives</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group bg-white p-8 rounded-3xl border border-slate-100 hover:border-blue-600 hover:shadow-xl transition-all">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-lg font-black mt-2 group-hover:text-blue-600 italic uppercase">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="text-center mt-32 py-10 opacity-20 text-[8px] font-black uppercase tracking-[1em]">
        VISORA AI • EXECUTED BY MANTU PATRA
      </footer>
    </main>
  )
}
