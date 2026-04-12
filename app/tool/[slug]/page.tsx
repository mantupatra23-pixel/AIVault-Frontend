import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // 1. DATA AGGREGATION
  const { data: tool } = await supabase.from('ai_tools').select('*').eq('slug', slug).single()
  if (!tool) return notFound()

  const { data: allTools } = await supabase.from('ai_tools').select('name, slug')
  const { data: related } = await supabase
    .from('ai_tools')
    .select('name, slug, category, pricing, score')
    .eq('category', tool.category)
    .neq('slug', slug)
    .limit(4)

  const finalUrl = tool.affiliate_url || tool.website_url
  const shareLink = `https://wa.me/?text=${encodeURIComponent(`Check this AI tool: ${tool.name} 🚀 https://ai-vault-frontend-blue.vercel.app/tool/${slug}`)}`;

  // 2. INTERNAL LINKING ENGINE
  const formatText = (text: string) => {
    if (!text) return "";
    let clean = text.replace(/[*#]/g, '').trim();
    if (allTools) {
      allTools.forEach(t => {
        if (t.slug !== slug) {
          const regex = new RegExp(`\\b(${t.name})\\b`, 'gi');
          clean = clean.replace(regex, `<a href="/tool/${t.slug}" class="text-blue-600 font-extrabold border-b-2 border-blue-100 hover:bg-blue-50 transition-all">$1</a>`);
        }
      });
    }
    return clean;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* 🧭 FULL-WIDTH MASTER NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 flex items-center z-[10000] px-6 shadow-sm">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
            <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase flex items-center gap-1">
              VISORA<span className="text-blue-600">.</span>
            </Link>
            <div className="flex items-center gap-4">
                <a href={shareLink} target="_blank" className="bg-[#25D366] text-white p-2.5 rounded-xl shadow-lg hover:scale-110 transition-all">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.844 1.694 5.73l-1.019 3.714 3.814-.999z"/></svg>
                </a>
                <a href={finalUrl} target="_blank" className="bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">EXECUTE ↗</a>
            </div>
        </div>
      </nav>

      <article className="max-w-5xl mx-auto px-6 pt-36 pb-24">
        
        {/* 🏆 HEADER BLOCK */}
        <header className="mb-20">
            <div className="flex items-center gap-4 mb-8">
                <span className="bg-blue-600 text-white text-[9px] font-[1000] px-4 py-2 rounded uppercase tracking-widest">{tool.category}</span>
                <span className="text-slate-400 text-[9px] font-black uppercase italic tracking-widest">Neural Score: {tool.score || 85}</span>
            </div>
            <h1 className="text-6xl md:text-[100px] font-[1000] tracking-tighter leading-[0.8] mb-12 uppercase italic">{tool.name}<span className="text-blue-600">.</span></h1>
            
            <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-300/20 border border-white/5">
                <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic">Executive Summary</h3>
                <p className="text-2xl md:text-3xl font-bold leading-tight italic" dangerouslySetInnerHTML={{ __html: formatText(tool.description?.split('.')[0] || "") }} />
            </div>
        </header>

        {/* 📽️ VIDEO ENGINE */}
        {tool.youtube_id && (
            <div className="mb-28 rounded-[3.5rem] overflow-hidden bg-slate-100 aspect-video shadow-2xl border-8 border-white">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Visora Tutorial" frameBorder="0" allowFullScreen></iframe>
            </div>
        )}

        {/* 🧬 FULL REPORT SECTION */}
        <section className="max-w-4xl mb-32">
            <h2 className="text-[12px] font-black uppercase tracking-[0.6em] text-blue-600 mb-12 italic border-l-8 border-blue-600 pl-6">Deep Intelligence Report</h2>
            <div className="text-xl text-slate-500 font-medium leading-[1.8] space-y-10">
                {tool.description?.split('\n').slice(1).map((para: string, i: number) => (
                    <p key={i} className="hover:text-slate-900 transition-colors" dangerouslySetInnerHTML={{ __html: formatText(para) }} />
                ))}
            </div>
        </section>

        {/* ⚖️ PROS/CONS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div className="bg-green-50 p-12 rounded-[3.5rem] border border-green-100 flex flex-col justify-center">
                <h4 className="text-green-600 text-[10px] font-black uppercase tracking-[0.4em] mb-6">✓ The Advantage</h4>
                <div className="text-base font-bold text-slate-700 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: formatText(tool.pros_cons?.split('Cons:')[0] || "High-speed automation.") }} />
            </div>
            <div className="bg-red-50 p-12 rounded-[3.5rem] border border-red-100 flex flex-col justify-center">
                <h4 className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em] mb-6">✕ The Friction</h4>
                <div className="text-base font-bold text-slate-700 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: formatText(tool.pros_cons?.split('Cons:')[1] || "Setup focus required.") }} />
            </div>
        </div>

        {/* ❓ NEURAL Q&A ENGINE */}
        <section className="bg-slate-50 p-12 md:p-16 rounded-[4.5rem] border border-slate-100 mb-32">
            <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 mb-12 italic text-center">Neural Inquiries</h2>
            <div className="space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-[1000] text-slate-900 text-xl mb-3 italic uppercase">Q: Why choose {tool.name}?</h4>
                    <p className="text-lg text-slate-500 font-medium italic">Optimized for {tool.category}, it cuts manual execution time by nearly 40%.</p>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-[1000] text-slate-900 text-xl mb-3 italic uppercase">Q: Access & Pricing?</h4>
                    <p className="text-lg text-slate-500 font-medium italic">Current intelligence status is {tool.pricing}. Visora links point directly to official portals.</p>
                </div>
            </div>
        </section>

        {/* 💰 CONVERSION BLOCK */}
        <section className="bg-white border-[6px] border-slate-900 p-16 md:p-24 rounded-[5rem] text-center shadow-2xl mb-40">
            <div className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em] mb-6">Deployment Status</div>
            <div className="text-6xl md:text-8xl font-[1000] text-slate-900 uppercase italic mb-12 tracking-tighter">MODEL: {tool.pricing}</div>
            <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-20 py-8 rounded-[2.5rem] font-[1000] uppercase tracking-widest text-sm shadow-2xl shadow-blue-200 hover:bg-black transition-all active:scale-95">VISIT OFFICIAL PORTAL ↗</a>
            <p className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Verified by Mantu Patra • VISORA AI CEO</p>
        </section>

        {/* 🌐 RELATED CLUSTER (FIXED) */}
        <section className="pt-24 border-t border-slate-100">
            <h3 className="text-[12px] font-black uppercase tracking-[0.7em] text-slate-300 mb-16 italic">Neural Alternatives</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {related && related.length > 0 ? related.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-10 rounded-[3rem] border border-slate-100 hover:border-blue-600 transition-all bg-white hover:shadow-2xl hover:-translate-y-2">
                        <span className="text-[9px] font-[1000] text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-2xl font-[1000] mt-4 group-hover:text-blue-600 italic uppercase leading-none tracking-tighter">{t.name}</h4>
                    </Link>
                )) : (
                  <div className="col-span-full text-center text-slate-300 font-black italic uppercase tracking-widest">Scanning for alternatives...</div>
                )}
            </div>
        </section>
      </article>

      <footer className="text-center py-24 opacity-20 text-[10px] font-black uppercase tracking-[1.5em] border-t border-slate-50">
        VISORA AI ENGINE • BHARAT MISSION
      </footer>
    </main>
  )
}
