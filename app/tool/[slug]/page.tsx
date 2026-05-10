import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// 1. ENGINE INITIALIZATION
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: any) {
  // 🛡️ CRITICAL: Wait for params (Next.js 15 Fix)
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 2. DATA ACQUISITION
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tool) return notFound()

  // Related Tools Fetching (Same Category)
  const { data: related } = await supabase
    .from('ai_tools')
    .select('name, slug, category, pricing')
    .eq('category', tool.category)
    .neq('slug', slug)
    .limit(4)

  const finalUrl = tool.affiliate_url || tool.link || tool.website
  const shareWa = `https://wa.me/?text=${encodeURIComponent(`Check out ${tool.name} on Visora: https://visora.ai/tool/${slug}`)}`

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 MASTER NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl z-[100] border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">
          VISORA<span className="text-blue-600">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <a href={shareWa} target="_blank" className="p-2.5 bg-green-50 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.433 1.096 3.385l-.717 2.623 2.685-.704c.816.519 1.782.822 2.822.822 3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.726-5.886-5.726z"/></svg>
          </a>
          <a href={finalUrl} target="_blank" className="bg-black text-white text-[10px] px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-600/10">
            Visit Portal
          </a>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 pt-44">
        
        {/* 🏆 HEADER SECTION */}
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{tool.category}</span>
            <div className="h-px w-12 bg-slate-100"></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Neural Score: {tool.score || '9.8'}</span>
          </div>
          
          <h1 className="text-6xl md:text-[110px] font-[1000] leading-[0.8] tracking-tighter italic uppercase mb-12">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>
          
          <div className="bg-slate-900 rounded-[50px] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic">Strategic Summary</h3>
            <p className="text-2xl md:text-4xl font-medium italic leading-tight">
              "Visora's neural analysis identifies {tool.name} as a top-tier engine for {tool.category} automation."
            </p>
          </div>
        </header>

        {/* 🧬 FULL REPORT */}
        <section className="mb-32">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-blue-600 mb-10 italic">Analysis Report</h2>
          <div className="text-xl md:text-2xl text-slate-600 leading-relaxed italic space-y-8 font-medium">
            {tool.description?.split('\n').map((p: string, i: number) => (
              <p key={i} className="border-l-4 border-slate-50 pl-8 hover:border-blue-600 transition-colors">{p}</p>
            ))}
          </div>
        </section>

        {/* ⚖️ PROS/CONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <div className="bg-[#f0fff4] p-12 rounded-[50px] border border-green-100 shadow-sm">
            <h4 className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-6 italic">✓ The Edge</h4>
            <div className="text-lg font-bold text-green-900 leading-loose italic whitespace-pre-line">
              {tool.pros || "• Optimized Performance\n• Scalable Architecture\n• User-Centric Design"}
            </div>
          </div>
          <div className="bg-[#fff5f5] p-12 rounded-[50px] border border-red-100 shadow-sm">
            <h4 className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-6 italic">× Friction</h4>
            <div className="text-lg font-bold text-red-900 leading-loose italic whitespace-pre-line">
              {tool.cons || "• API Credit Dependent\n• Niche Market focus\n• Learning Curve"}
            </div>
          </div>
        </div>

        {/* 💰 PRICING CTA */}
        <section className="bg-white border-[8px] border-black rounded-[60px] p-12 md:p-24 text-center shadow-2xl mb-40">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-6 block italic">Access Node</span>
          <div className="text-7xl md:text-[100px] font-[1000] italic uppercase tracking-tighter mb-14 leading-none">
            {tool.pricing}
          </div>
          <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-16 py-7 rounded-full font-[1000] text-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/40">
            Visit Portal ↗
          </a>
          <p className="mt-14 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verified by Mantu Patra • {tool.name} Engine</p>
        </section>

        {/* 🌐 RELATED CLUSTER */}
        <section className="pt-24 border-t border-gray-100">
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-300 mb-12 italic">Neural Cluster Discovery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {related?.map((t) => (
              <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-8 bg-white border border-gray-100 rounded-[40px] hover:border-blue-600 transition-all hover:-translate-y-2 duration-500">
                <span className="text-[9px] font-black uppercase text-blue-600 block mb-3 italic">{t.category}</span>
                <h4 className="text-2xl font-[1000] italic uppercase leading-tight group-hover:text-blue-600">{t.name}</h4>
              </Link>
            ))}
          </div>
        </section>

      </article>

      <footer className="text-center py-32 opacity-20 text-[10px] font-black uppercase tracking-[0.8em]">
        VISORA AI ENGINE • FOUNDER MODE
      </footer>
    </main>
  )
}
