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
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${tool.name} on Visora AI! 🚀 https://ai-vault-frontend-blue.vercel.app/tool/${slug}`)}`;

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-20 font-sans selection:bg-blue-600 selection:text-white relative z-[100]">
      
      {/* 🧭 VISORA MASTER NAVIGATION (OVERRIDE) */}
      <nav className="border-b border-slate-100 bg-white/95 backdrop-blur-xl sticky top-0 z-[9999] shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">VISORA<span className="text-blue-600">.</span></Link>
            
            <div className="flex items-center gap-4">
                <a href={shareUrl} target="_blank" className="bg-[#25D366] text-white p-2.5 rounded-xl hover:scale-110 transition-all shadow-lg shadow-green-100">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.844 1.694 5.73l-1.019 3.714 3.814-.999z"/></svg>
                </a>
                <a href={finalUrl} target="_blank" className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">EXECUTE ↗</a>
            </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        
        {/* 🏆 HEADER BLOCK */}
        <header className="pt-16 pb-12 mb-12">
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-widest">{tool.category}</span>
                <span className="text-slate-300 font-bold">/</span>
                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest italic tracking-tighter">Neural Score: {tool.score || 85}</span>
            </div>
            <h1 className="text-6xl md:text-[100px] font-[1000] tracking-tighter leading-[0.85] mb-12 uppercase italic">{tool.name}<span className="text-blue-600">.</span></h1>
            
            <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl shadow-blue-100/40 border border-white/10">
                <h3 className="text-blue-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4">Strategic Summary</h3>
                <p className="text-xl md:text-2xl font-bold leading-tight italic">"{tool.description?.split('.')[0]}."</p>
            </div>
        </header>

        {/* 📽️ VIDEO HUB */}
        {tool.youtube_id && (
            <section className="mb-24 rounded-[3rem] overflow-hidden bg-slate-50 aspect-video shadow-2xl shadow-slate-200 border-8 border-white">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Visora Intelligence" frameBorder="0" allowFullScreen></iframe>
            </section>
        )}

        {/* 🧬 DEEP DIVE ANALYSIS */}
        <section className="max-w-3xl mb-24">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 mb-10 underline decoration-slate-200 underline-offset-8 italic">Full Analysis</h2>
            <div className="text-lg text-slate-500 font-medium leading-[1.8] space-y-8">
                {tool.description?.split('\n').slice(1).map((para: string, i: number) => (
                    <p key={i} className="hover:text-slate-900 transition-colors">{para}</p>
                ))}
            </div>
        </section>

        {/* ⚖️ PROS & CONS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
            <div className="bg-[#f0fff4] p-10 rounded-[3rem] border border-green-100">
                <h4 className="text-green-600 text-[9px] font-black uppercase tracking-widest mb-4">✓ Advantages</h4>
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{tool.pros_cons?.split('Cons:')[0] || "Highly efficient workflow."}</p>
            </div>
            <div className="bg-[#fff5f5] p-10 rounded-[3rem] border border-red-100">
                <h4 className="text-red-600 text-[9px] font-black uppercase tracking-widest mb-4">✕ Friction Points</h4>
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{tool.pros_cons?.split('Cons:')[1] || "Initial setup focus."}</p>
            </div>
        </section>

        {/* ❓ INTELLIGENCE Q&A (FULLY INTEGRATED) */}
        <section className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 mb-24">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 italic">Common Inquiries</h2>
            <div className="space-y-8">
                <div className="border-b border-slate-200 pb-6">
                    <h4 className="font-[1000] text-slate-900 text-lg mb-2 italic uppercase tracking-tighter">Q: Is {tool.name} suitable for beginners?</h4>
                    <p className="text-sm text-slate-500 font-medium italic leading-relaxed">Yes, with a Neural Score of {tool.score}, it is designed to balance power and ease of use.</p>
                </div>
                <div className="border-b border-slate-200 pb-6">
                    <h4 className="font-[1000] text-slate-900 text-lg mb-2 italic uppercase tracking-tighter">Q: What is the cost structure?</h4>
                    <p className="text-sm text-slate-500 font-medium italic leading-relaxed">Current pricing is listed as {tool.pricing}. We recommend checking the official portal for seasonal offers.</p>
                </div>
                <div>
                    <h4 className="font-[1000] text-slate-900 text-lg mb-2 italic uppercase tracking-tighter">Q: Why access via Visora?</h4>
                    <p className="text-sm text-slate-500 font-medium italic leading-relaxed">Our executive links are verified for security and performance tracking.</p>
                </div>
            </div>
        </section>

        {/* 💰 FINAL CONVERSION */}
        <section className="bg-white border-2 border-slate-100 p-12 rounded-[3.5rem] text-center shadow-xl shadow-slate-100/50 mb-32">
            <div className="text-5xl font-[1000] text-slate-900 uppercase italic mb-8">MODEL: {tool.pricing}</div>
            <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-16 py-6 rounded-[2rem] font-[1000] uppercase tracking-widest text-xs shadow-2xl shadow-blue-200 hover:scale-105 transition-all">VISIT OFFICIAL INTERFACE ↗</a>
            <p className="mt-8 text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Verified by Mantu Patra • VISORA AI CEO</p>
        </section>

        {/* 🌐 RELATED CLUSTER */}
        <section className="pt-20 border-t border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-12 italic">Neural Alternatives</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-8 rounded-[2rem] border border-slate-100 hover:border-blue-600 transition-all bg-white hover:shadow-2xl">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-md font-black mt-3 group-hover:text-blue-600 italic uppercase leading-tight">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="text-center mt-32 py-12 opacity-10 text-[8px] font-black uppercase tracking-[1.2em] border-t border-slate-50">
        VISORA AI • BHARAT MISSION 2026
      </footer>
    </main>
  )
}
