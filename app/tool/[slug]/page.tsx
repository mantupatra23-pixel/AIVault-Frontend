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
  const shareText = encodeURIComponent(`Check out ${tool.name} on Visora AI Vault! 🚀`);
  const shareUrl = encodeURIComponent(`https://ai-vault-frontend-blue.vercel.app/tool/${slug}`);

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-20 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 THE ONLY NAVIGATION (VISORA EXCLUSIVE) */}
      <nav className="border-b border-slate-100 bg-white/95 backdrop-blur-xl sticky top-0 z-[999]">
        <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link href="/" className="font-black text-2xl tracking-tighter italic uppercase">VISORA<span className="text-blue-600">.</span></Link>
            
            <div className="flex items-center gap-3">
                {/* 📲 WHATSAPP SHARE BUTTON */}
                <a 
                  href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                  target="_blank"
                  className="bg-[#25D366] text-white p-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-green-100"
                  title="Share on WhatsApp"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.844 1.694 5.73l-1.019 3.714 3.814-.999z"/></svg>
                </a>
                
                <a href={finalUrl} target="_blank" className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Execute ↗</a>
            </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        
        {/* 🏆 HEADER SECTION */}
        <header className="pt-20 pb-12 mb-12 border-b border-slate-50">
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-widest">{tool.category}</span>
                <span className="text-slate-300 font-bold">/</span>
                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest italic tracking-tighter">Verified Status: {tool.score || 85}</span>
            </div>
            <h1 className="text-6xl md:text-[90px] font-[1000] tracking-tighter leading-[0.9] mb-12 uppercase italic">{tool.name}<span className="text-blue-600">.</span></h1>
            
            <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl shadow-blue-100/40 relative overflow-hidden">
                <h3 className="text-blue-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4">Strategic Summary</h3>
                <p className="text-xl md:text-2xl font-bold leading-tight italic">"{tool.description?.split('.')[0]}."</p>
            </div>
        </header>

        {/* 🧬 ANALYSIS CONTENT */}
        <div className="space-y-24">
            
            {/* VIDEO PLAYER */}
            {tool.youtube_id && (
                <div className="rounded-[3rem] overflow-hidden bg-slate-50 aspect-video shadow-2xl shadow-slate-100 border-8 border-white">
                    <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0`} title="Visora Tutorial" frameBorder="0" allowFullScreen></iframe>
                </div>
            )}

            {/* FULL REVIEW */}
            <section className="max-w-3xl">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 mb-10 underline decoration-slate-200 underline-offset-8 italic">Neural Insight</h2>
                <div className="text-lg text-slate-500 font-medium leading-[1.8] space-y-8">
                    {tool.description?.split('\n').map((para: string, i: number) => (
                        <p key={i} className="hover:text-slate-900 transition-colors">{para}</p>
                    ))}
                </div>
            </section>

            {/* Q&A BLOCK */}
            <section className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 italic">Intelligence Q&A</h2>
                <div className="space-y-8">
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="font-black text-slate-900 text-lg mb-2 italic">Q: What is the primary use of {tool.name}?</h4>
                        <p className="text-sm text-slate-500 font-medium italic">It is specifically designed for {tool.category} automation and workflow optimization.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-lg mb-2 italic">Q: Is {tool.name} free to use?</h4>
                        <p className="text-sm text-slate-500 font-medium italic">The current pricing model is {tool.pricing}. Check the official link for real-time updates.</p>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="bg-white border-2 border-slate-100 p-12 rounded-[3.5rem] text-center shadow-xl shadow-slate-100/50">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4 italic italic">Ready for Deployment</div>
                <div className="text-5xl font-[1000] text-slate-900 uppercase italic mb-8">STATUS: {tool.pricing}</div>
                <a href={finalUrl} target="_blank" className="inline-block bg-blue-600 text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-200 hover:scale-105 transition-all">Visit {tool.name} Website ↗</a>
                <p className="mt-8 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Verified by Mantu Patra • Founder @ Visora AI</p>
            </section>
        </div>

        {/* RELATED ALTERNATIVES */}
        <section className="mt-40 pt-20 border-t border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-12 italic">Neural Alternatives</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related?.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group p-8 rounded-[2rem] border border-slate-100 hover:border-blue-600 transition-all bg-white hover:shadow-2xl">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-md font-black mt-3 group-hover:text-blue-600 italic uppercase leading-tight tracking-tighter">{t.name}</h4>
                    </Link>
                ))}
            </div>
        </section>
      </article>

      <footer className="text-center mt-32 py-12 opacity-10 text-[8px] font-black uppercase tracking-[1em] border-t border-slate-50">
        VISORA AI • BHARAT MISSION 2026
      </footer>
    </main>
  )
}
