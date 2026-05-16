export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: any) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tool) return notFound()

  const { data: related } = await supabase
    .from('ai_tools')
    .select('name, slug, category, pricing')
    .eq('category', tool.category)
    .neq('slug', slug)
    .limit(4)

  // 🔗 LINK MATRIX SNIPER (Frontend Level Loop Protection)
  const getSafeUrl = (url: string) => {
    if (!url) return `https://www.google.com/search?q=${encodeURIComponent(tool.name + " AI tool official website")}`;
    const cleanUrl = url.trim();
    
    // 🔥 SENSING & BYPASSING PRODUCT HUNT LINKS ON THE FLY
    if (
      cleanUrl === "#" || 
      cleanUrl.includes(`/tool/`) || 
      cleanUrl === slug || 
      cleanUrl.includes("producthunt.com")
    ) {
      return `https://www.google.com/search?q=${encodeURIComponent(tool.name + " AI tool official website")}`;
    }
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    return `https://${cleanUrl}`;
  };

  const finalUrl = getSafeUrl(tool.website_url || tool.affiliate_url || tool.link);

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans pb-20 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-[999] border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">
          VISORA<span className="text-blue-600">.</span>
        </Link>
        <div className="relative z-[1000]">
          <a 
            href={finalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-black text-white text-[10px] px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 transition-all cursor-pointer inline-block pointer-events-auto"
          >
            Visit Portal
          </a>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 pt-44 relative z-10">
        
        {/* 🏆 HERO HEADER */}
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{tool.category}</span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Neural Score: 9.8</span>
          </div>
          <h1 className="text-6xl md:text-[110px] font-[1000] leading-[0.8] tracking-tighter italic uppercase mb-12">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>
          <div className="bg-slate-900 rounded-[50px] p-10 md:p-16 text-white shadow-2xl">
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic">Strategic Summary</h3>
            <p className="text-2xl md:text-4xl font-medium italic leading-tight">
              "Visora analysis identifies {tool.name} as a top-tier engine for {tool.category}."
            </p>
          </div>
        </header>

        {/* 🧬 ANALYSIS REPORT */}
        <section className="mb-32">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-blue-600 mb-10 italic">Analysis Report</h2>
          <div className="text-xl md:text-2xl text-slate-600 leading-relaxed italic space-y-8 font-medium border-l-4 border-slate-100 pl-8">
            {tool.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ⚖️ PROS/CONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <div className="bg-[#f0fff4] p-12 rounded-[50px] border border-green-100 shadow-sm">
            <h4 className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-6 italic">✓ The Edge</h4>
            <div className="text-lg font-bold text-green-900 italic whitespace-pre-line">{tool.pros || "Optimized Performance\nScalable Network Pipeline"}</div>
          </div>
          <div className="bg-[#fff5f5] p-12 rounded-[50px] border border-red-100 shadow-sm">
            <h4 className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-6 italic">× Friction</h4>
            <div className="text-lg font-bold text-red-900 italic whitespace-pre-line">{tool.cons || "Learning Curve Involved\nContext Window Tokens Dependency"}</div>
          </div>
        </div>

        {/* 💰 PRICING CTA */}
        <section className="relative bg-white border-[8px] border-black rounded-[60px] p-12 md:p-24 text-center shadow-2xl mb-40">
          <div className="text-7xl md:text-[100px] font-[1000] italic uppercase tracking-tighter mb-14 leading-none pointer-events-none select-none">
            {tool.pricing}
          </div>
          
          <div className="relative z-[999] block">
            <a 
              href={finalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ position: 'relative', zIndex: 9999, display: 'inline-block' }}
              className="bg-blue-600 text-white px-16 py-7 rounded-full font-[1000] text-2xl uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-blue-600/40 cursor-pointer active:scale-95 pointer-events-auto"
            >
              Visit Official Portal ↗
            </a>
          </div>
          
          <p className="mt-14 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pointer-events-none select-none">Verified Intelligence • Mantu Patra CEO</p>
        </section>

        {/* 🌐 RELATED CLUSTERS */}
        <section className="pt-24 border-t border-gray-100">
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-300 mb-12 italic uppercase">Neural Discovery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {related?.map((t) => (
              <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-8 bg-white border border-gray-100 rounded-[40px] hover:border-blue-600 transition-all block relative z-10 hover:-translate-y-2 duration-500">
                <span className="text-[9px] font-black uppercase text-blue-600 block mb-3 italic">{t.category}</span>
                <h4 className="text-2xl font-[1000] italic uppercase leading-tight group-hover:text-blue-600">{t.name}</h4>
              </Link>
            ))}
          </div>
        </section>
      </article>

      <footer className="text-center py-32 opacity-20 text-[10px] font-black uppercase tracking-[0.8em]">
        VISORA AI ENGINE • BHARAT MISSION
      </footer>
    </main>
  )
}
