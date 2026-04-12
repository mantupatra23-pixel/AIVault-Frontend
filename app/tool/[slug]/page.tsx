import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // 1. DATA FETCHING
  const { data: tool } = await supabase.from('ai_tools').select('*').eq('slug', slug).single()
  if (!tool) return notFound()

  const { data: allTools } = await supabase.from('ai_tools').select('name, slug')
  const { data: related } = await supabase.from('ai_tools').select('name, slug, category, pricing, score').eq('category', tool.category).neq('slug', slug).limit(4)

  const finalUrl = tool.affiliate_url || tool.website_url
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${tool.name} on Visora! 🚀 https://ai-vault-frontend-blue.vercel.app/tool/${slug}`)}`;

  // 2. INTERNAL LINKING ENGINE
  const formatContent = (text: string) => {
    if (!text) return "";
    let cleanText = text.replace(/[*#]/g, '').trim();
    if (allTools) {
      allTools.forEach(t => {
        if (t.slug !== slug) {
          const regex = new RegExp(`\\b(${t.name})\\b`, 'gi');
          cleanText = cleanText.replace(regex, `<a href="/tool/${t.slug}" class="text-blue-600 font-extrabold underline decoration-2 underline-offset-4 hover:bg-blue-50 transition-all">$1</a>`);
        }
      });
    }
    return cleanText;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative z-[999]">
      
      {/* 🧭 THE ONLY NAV (FORCE OVERRIDE) */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center z-[10000] px-6">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
            <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">VISORA<span className="text-blue-600">.</span></Link>
            <div className="flex items-center gap-4">
                <a href={shareUrl} target="_blank" className="bg-[#25D366] text-white p-2.5 rounded-xl shadow-lg hover:scale-110 transition-all">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.844 1.694 5.73l-1.019 3.714 3.814-.999z"/></svg>
                </a>
                <a href={finalUrl} target="_blank" className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">EXECUTE ↗</a>
            </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        
        {/* 🏆 HERO SECTION */}
        <header className="mb-16">
            <div className="flex items-center gap-3 mb-8">
                <span className="bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded uppercase tracking-widest">{tool.category}</span>
                <span className="text-slate-400 text-[9px] font-black uppercase italic tracking-widest">Neural Score: {tool.score || 85}</span>
            </div>
            <h1 className="text-6xl md:text-9xl font-[1000] tracking-tighter leading-[0.8] mb-12 uppercase italic">{tool.name}<span className="text-blue-600">.</span></h1>
            
            <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-200/40">
                <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Strategic Summary</h3>
                <p className="text-2xl md:text-3xl font-bold leading-tight italic" dangerouslySetInnerHTML={{ __html: formatContent(tool.description?.split('.')[0] || "") }} />
            </div>
        </header>

        {/* 📽️ VIDEO / MEDIA */}
        {tool.youtube_id && (
            <div className="mb-24 rounded-[3.5rem] overflow-hidden bg-slate-100 aspect-video shadow-2xl border-8 border-white">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Tutorial" frameBorder="0" allowFullScreen></iframe>
            </div>
        )}

        {/* 🧬 ANALYSIS */}
        <div className="space-y-24 mb-32">
            <section className="max-w-3xl">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-600 mb-10 italic border-l-4 border-blue-600 pl-4">Full Intelligence Report</h2>
                <div className="text-xl text-slate-500 font-medium leading-[1.8] space-y-8">
                    {tool.description?.split('\n').slice(1).map((para: string, i: number) => (
                        <p key={i} className="hover:text-slate-900 transition-colors" dangerouslySetInnerHTML={{ __html: formatContent(para) }} />
                    ))}
                </div>
            </section>

            {/* ⚖️ PROS/CONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#f0fff4] p-12 rounded-[3.5rem] border border-green-100">
                    <h4 className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-6 tracking-[0.3em]">✓ Advantages</h4>
                    <div className="text-sm font-bold text-slate-700 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: formatContent(tool.pros_cons?.split('Cons:')[0] || "") }} />
                </div>
                <div className="bg-[#fff5f5] p-12 rounded-[3.5rem] border border-red-100">
                    <h4 className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-6 tracking-[0.3em]">✕ Limitations</h4>
                    <div className="text-sm font-bold text-slate-700 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: formatContent(tool.pros_cons?.split('Cons:')[1] || "") }} />
                </div>
            </div>

            {/* ❓ Q&A SECTION (FIXED) */}
            <section className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 mb-12 italic text-center">Neural Q&A</h2>
                <div className="space-y-10">
                    <div className="bg-white p-8 rounded-3xl shadow-sm">
                        <h4 className="font-black text-slate-900 text-xl mb-3 italic">Q: Why use {tool.name} for your workflow?</h4>
                        <p className="text-base text-slate-500 font-medium italic">It automates {tool.category} tasks with high precision, saving approximately 40% of manual effort.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm">
                        <h4 className="font-black text-slate-900 text-xl mb-3 italic">Q: What is the official pricing?</h4>
                        <p className="text-base text-slate-500 font-medium italic">Currently listed as {tool.pricing}. Our links lead directly to the latest verified pricing tiers.</p>
                    </div>
                </div>
            </section>

            {/* 💰 CONVERSION BLOCK */}
            <section className="bg-white border-4 border-slate-900 p-16 rounded-[4rem] text-center shadow-2xl shadow-slate-200">
                <div className="text-6xl font-[1000] text-slate-900 uppercase italic mb-10 tracking-tighter">MODEL: {tool.pricing}</div>
                <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">VISIT OFFICIAL SITE ↗</a>
                <p className="mt-10 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Verified Intelligence • Mantu Patra CEO</p>
            </section>
        </div>

        {/* 🌐 RELATED */}
        <section className="pt-24 border-t border-slate-100">
            <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-300 mb-12 italic">Related Entities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-10 rounded-[2.5rem] border border-slate-100 hover:border-blue-600 transition-all bg-white hover:shadow-2xl">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-lg font-black mt-3 group-hover:text-blue-600 italic uppercase leading-none">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="text-center py-20 opacity-10 text-[9px] font-black uppercase tracking-[1.5em] border-t border-slate-50">
        VISORA AI ENGINE • BHARAT MISSION
      </footer>
    </main>
  )
}
