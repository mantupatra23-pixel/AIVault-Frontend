import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // 1. DATA ACQUISITION
  const { data: tool } = await supabase.from('ai_tools').select('*').eq('slug', slug).single()
  if (!tool) return notFound()

  const { data: allTools } = await supabase.from('ai_tools').select('name, slug')
  const { data: related } = await supabase
    .from('ai_tools')
    .select('name, slug, category, description')
    .eq('category', tool.category)
    .neq('slug', slug)
    .limit(3)

  const finalUrl = tool.affiliate_url || tool.website_url
  const shareUrl = `https://ai-vault-frontend-blue.vercel.app/tool/${slug}`

  // 2. NEURAL LINKING ENGINE (Auto-Links other tools in description)
  const renderSmartContent = (text: string) => {
    if (!text) return "";
    let cleanText = text.replace(/[*#]/g, '').trim();
    if (allTools) {
      allTools.forEach(t => {
        if (t.slug !== slug) {
          const regex = new RegExp(`\\b(${t.name})\\b`, 'gi');
          cleanText = cleanText.replace(regex, `<a href="/tool/${t.slug}" class="text-blue-600 font-bold underline decoration-blue-200 hover:decoration-blue-600 transition-all">$1</a>`);
        }
      });
    }
    return cleanText;
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 pb-32 selection:bg-blue-600 selection:text-white font-sans">
      
      {/* 🧭 NAVIGATION BAR */}
      <nav className="max-w-6xl mx-auto p-8 flex justify-between items-center border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-all">
          ← Back to Vault
        </Link>
        <div className="flex gap-4">
            <a href={`https://api.whatsapp.com/send?text=Check this AI: ${shareUrl}`} target="_blank" className="text-[8px] font-black bg-[#25D366] text-white px-5 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-green-100 hover:scale-105 transition-all">
                Share Intelligence
            </a>
        </div>
      </nav>

      <article className="max-w-5xl mx-auto px-6">
        
        {/* 🏆 HERO SECTION */}
        <header className="pt-20 pb-16 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <span className="bg-blue-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                {tool.category}
              </span>
              {tool.is_featured && (
                <span className="bg-amber-400 text-black text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest italic animate-pulse">
                    🔥 Trending Now
                </span>
              )}
          </div>
          
          <h1 className="text-6xl md:text-[110px] font-[1000] tracking-[-0.06em] leading-[0.85] text-gray-900 mb-12 uppercase italic">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          <div className="flex justify-center md:justify-start gap-8 opacity-40 text-[10px] font-black uppercase tracking-[0.3em]">
              <span>⭐ Neural Score: {tool.score || 85}/100</span>
              <span>💰 Access: {tool.pricing}</span>
          </div>
        </header>

        {/* 📽️ SMART PLAYER (FUTUREPEDIA STYLE) */}
        {tool.youtube_id && (
          <section className="mb-24 relative rounded-[3.5rem] overflow-hidden shadow-2xl shadow-blue-100 border-8 border-white bg-black group transition-transform hover:scale-[1.01]">
            <div className="aspect-video">
                <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${tool.youtube_id}?modestbranding=1&rel=0&controls=1&showinfo=0`}
                    title="Intelligence Tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
          </section>
        )}

        {/* 🧬 CORE ANALYSIS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32">
            
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-12">
                <section className="bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl font-black italic">"</div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200 mb-6">Mantu's Strategic Take</h4>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight leading-tight italic relative z-10" 
                       dangerouslySetInnerHTML={{ __html: renderSmartContent(tool.description?.split('\n')[0] || "") }} />
                </section>

                <section className="text-gray-500 leading-[1.8] font-medium text-lg space-y-8 px-4">
                  {tool.description?.split('\n').slice(1).map((para: string, i: number) => (
                    <div key={i} className="hover:text-gray-900 transition-colors" 
                         dangerouslySetInnerHTML={{ __html: renderSmartContent(para) }} />
                  ))}
                </section>
            </div>

            {/* 💰 CONVERSION SIDEBAR (STICKY) */}
            <aside className="relative">
                <div className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-sm sticky top-32">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center italic underline decoration-blue-600">Access Node</h3>
                    <a 
                      href={finalUrl} 
                      target="_blank" 
                      className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center block shadow-2xl hover:bg-blue-600 transition-all mb-4 active:scale-95"
                    >
                      Visit Official Interface ↗
                    </a>
                    <p className="text-[8px] text-gray-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                        Verified Access through Visora AI Engine
                    </p>
                    
                    <div className="mt-8 pt-8 border-t border-gray-50">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-300">
                            <span>Security</span>
                            <span className="text-green-500">Encrypted</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        {/* ⚖️ PROS & CONS (REVENUE OPTIMIZED) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div className="bg-[#f0fff4] border border-green-100 p-12 rounded-[3.5rem]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-600 mb-8 tracking-[0.5em]">The Advantage</h3>
                <div className="text-gray-700 font-bold text-sm leading-relaxed" 
                     dangerouslySetInnerHTML={{ __html: renderSmartContent(tool.pros_cons?.split('Cons:')[0] || "System Optimization Enabled.") }} />
            </div>
            <div className="bg-[#fff5f5] border border-red-100 p-12 rounded-[3.5rem]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-8 tracking-[0.5em]">The Limitation</h3>
                <div className="text-gray-700 font-bold text-sm leading-relaxed" 
                     dangerouslySetInnerHTML={{ __html: renderSmartContent(tool.pros_cons?.split('Cons:')[1] || "Setup requires focus.") }} />
            </div>
        </section>

        {/* 🌐 RELATED INTELLIGENCE */}
        {related && related.length > 0 && (
          <section className="pt-24 border-t border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-12">Neural Network Discovery</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {related.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group bg-white p-10 rounded-[2.5rem] border border-gray-100 hover:border-blue-600 transition-all shadow-sm">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-xl font-black mt-3 group-hover:text-blue-600 transition-colors italic uppercase tracking-tighter">{t.name}</h4>
                    </Link>
                ))}
            </div>
          </section>
        )}
      </article>

      {/* 🏁 FOOTER */}
      <footer className="text-center mt-40 pb-20 opacity-20 text-[8px] font-black uppercase tracking-[0.6em]">
        VISORA AI • EXECUTED BY MANTU PATRA
      </footer>
    </main>
  )
}
