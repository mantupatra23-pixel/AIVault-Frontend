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
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-2xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-xl group-hover:bg-blue-600 transition-all">V</div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visora Vault</span>
            </Link>
            <div className="hidden md:flex gap-8 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/" className="hover:text-blue-600">Directory</Link>
                <a href="#" className="hover:text-blue-600">Submit Tool</a>
            </div>
            <a href={finalUrl} target="_blank" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all">Direct Access ↗</a>
        </div>
      </nav>

      <article className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* 🏆 HEADER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-end">
            <div className="lg:col-span-8">
                <div className="flex items-center gap-3 mb-8">
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-widest border border-blue-100">{tool.category}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Visora Verified Intelligence</span>
                </div>
                <h1 className="text-7xl md:text-[110px] font-[1000] tracking-[-0.05em] leading-[0.85] text-slate-900 mb-8 uppercase italic">
                    {tool.name}<span className="text-blue-600">.</span>
                </h1>
            </div>
            
            <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10 text-center">
                    <div className="text-6xl font-[1000] text-blue-600 italic leading-none">{tool.score || 88}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Executive Score</div>
                    <div className="mt-6 flex justify-center gap-1">
                        {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-lg">★</span>)}
                    </div>
                </div>
            </div>
        </div>

        {/* ⚡ EXECUTIVE SUMMARY (NEW) */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900 text-white p-10 rounded-[3rem] flex flex-col justify-center">
                <h3 className="text-blue-400 text-[9px] font-black uppercase tracking-[0.4em] mb-4 italic">Core Value Proposition</h3>
                <p className="text-2xl font-bold tracking-tight leading-snug italic">"{tool.description?.split('.')[0]}."</p>
            </div>
            <div className="bg-white border-2 border-dashed border-slate-200 p-10 rounded-[3rem] flex flex-col justify-center text-center">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Type</div>
                <div className="text-3xl font-[1000] text-slate-900 uppercase italic leading-none">{tool.pricing}</div>
            </div>
        </section>

        {/* 🧬 MAIN CONTENT ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-32">
            <div className="lg:col-span-2 space-y-20">
                
                {/* 📽️ SMART PLAYER */}
                {tool.youtube_id && (
                    <div className="rounded-[3.5rem] overflow-hidden shadow-2xl shadow-blue-50 border-8 border-white bg-slate-900 aspect-video group">
                        <iframe className="w-full h-full group-hover:opacity-90 transition-opacity" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Visora Tutorial" frameBorder="0" allowFullScreen></iframe>
                    </div>
                )}

                {/* DEEP ANALYSIS */}
                <section className="prose prose-slate prose-xl max-w-none">
                    <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter mb-10 text-slate-900 border-l-8 border-blue-600 pl-6">Neural Insight</h2>
                    <div className="text-slate-500 font-medium leading-[1.8] space-y-8">
                        {tool.description?.split('\n').map((para: string, i: number) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </section>

                {/* ⚔️ COMPARISON TABLE (NEW) */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-8 italic">Market Comparison</h2>
                    <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-6">Intelligence Entity</th>
                                    <th className="px-8 py-6">Pricing</th>
                                    <th className="px-8 py-6 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr className="bg-blue-50/30">
                                    <td className="px-8 py-6 font-black text-blue-600">{tool.name} (Current)</td>
                                    <td className="px-8 py-6 text-xs font-bold uppercase">{tool.pricing}</td>
                                    <td className="px-8 py-6 text-right font-black italic">{tool.score}</td>
                                </tr>
                                {related?.slice(0, 2).map(r => (
                                    <tr key={r.slug}>
                                        <td className="px-8 py-6 font-bold text-slate-900">{r.name}</td>
                                        <td className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">{r.pricing}</td>
                                        <td className="px-8 py-6 text-right font-bold text-slate-400 italic">{r.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* 💰 CONVERSION SIDEBAR */}
            <aside>
                <div className="sticky top-32 space-y-6">
                    <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm space-y-8">
                        <div>
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4">Verified By</div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">MP</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-900">Mantu Patra</div>
                                    <div className="text-[8px] font-bold text-blue-600 uppercase italic">Founder & CEO</div>
                                </div>
                            </div>
                        </div>
                        <a href={finalUrl} target="_blank" className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center block hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200">Visit Official Site ↗</a>
                    </div>

                    {/* PROS MINI CARD */}
                    <div className="bg-green-50 p-10 rounded-[3rem] border border-green-100">
                        <h4 className="text-[9px] font-black text-green-600 uppercase tracking-[0.4em] mb-4 italic">Quick Verdict</h4>
                        <ul className="text-xs font-bold text-slate-600 space-y-3">
                            <li className="flex gap-2"><span>✓</span> Highly Efficient</li>
                            <li className="flex gap-2"><span>✓</span> Mobile Friendly</li>
                        </ul>
                    </div>
                </div>
            </aside>
        </div>

        {/* 🌐 RELATED CLUSTER */}
        <section className="pt-24 border-t border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-12">Neural Cluster Discovery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:-translate-y-2 transition-all">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-lg font-[1000] mt-3 group-hover:text-blue-600 italic uppercase leading-none tracking-tighter">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="max-w-7xl mx-auto px-6 mt-40 pt-20 border-t border-slate-100 text-center">
        <div className="text-[8px] font-black uppercase tracking-[1em] text-slate-300">
          VISORA AI ENGINE • REVOLUTIONIZING BHARAT
        </div>
      </footer>
    </main>
  )
}
