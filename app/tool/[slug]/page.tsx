import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // 1. DATA FETCHING (Current Tool, All Names for Auto-link, Related Tools)
  const { data: tool } = await supabase.from('ai_tools').select('*').eq('slug', slug).single()
  if (!tool) return notFound()

  const { data: allTools } = await supabase.from('ai_tools').select('name, slug')
  const { data: related } = await supabase
    .from('ai_tools')
    .select('name, slug, category, description')
    .eq('category', tool.category)
    .neq('slug', slug)
    .limit(3)

  const shareUrl = `https://ai-vault-frontend-blue.vercel.app/tool/${slug}`

  // 2. AUTO-LINKING LOGIC
  const renderSmartContent = (text: string) => {
    if (!text) return "";
    let cleanText = text.replace(/[*#]/g, '').trim();
    
    if (allTools) {
      allTools.forEach(t => {
        if (t.slug !== slug) { // Apne aap ko link mat karo
          const regex = new RegExp(`\\b(${t.name})\\b`, 'gi');
          cleanText = cleanText.replace(regex, `<a href="/tool/${t.slug}" class="text-blue-600 font-black underline decoration-blue-200 hover:decoration-blue-600 transition-all">$1</a>`);
        }
      });
    }
    return cleanText;
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 pb-32 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10"></div>

      {/* TOP NAV & VIRAL SHARING */}
      <nav className="max-w-6xl mx-auto p-8 flex justify-between items-center">
        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-all">
          ← Return to Vault
        </Link>
        <div className="flex gap-4">
            <a 
              href={`https://api.whatsapp.com/send?text=Check this AI Tool: ${shareUrl}`} 
              target="_blank" 
              className="text-[9px] font-black uppercase tracking-widest text-green-600 border border-green-100 px-5 py-2.5 rounded-full bg-white shadow-sm hover:bg-green-50 transition-all"
            >
              Share WhatsApp
            </a>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        {/* HEADER SECTION */}
        <header className="pt-16 pb-20">
          <div className="flex items-center gap-4 mb-10">
              <span className="bg-blue-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{tool.category}</span>
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest italic shadow-sm">★ Mantu Verified Review</span>
          </div>
          
          <h1 className="text-6xl md:text-[100px] font-[1000] tracking-[-0.06em] leading-[0.85] text-gray-900 mb-12 break-words">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          <div className="flex flex-wrap gap-8 opacity-50 text-[10px] font-black uppercase tracking-[0.2em] items-center">
              <span className="flex items-center gap-2"><span className="text-lg">⭐</span> Score: {tool.score || 85}/100</span>
              <span className="flex items-center gap-2"><span className="text-lg">💰</span> {tool.pricing}</span>
          </div>
        </header>

        {/* HIGH-IMPACT FOUNDER'S TAKE */}
        <section className="mb-24 bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 opacity-10 text-[180px] font-black -rotate-12 translate-x-12 translate-y-[-40px] select-none group-hover:rotate-0 transition-transform duration-700">”</div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200 mb-6">Mantu's Strategic Execution Take</h4>
            <p className="text-2xl md:text-3xl font-bold tracking-tight leading-tight italic relative z-10">
                "Automation is the new fuel. Ye tool unke liye hai jo scale karna chahte hain. Iska logic matchless hai, execute it without hesitation."
            </p>
        </section>

        {/* MAIN ANALYSIS (With Auto-Links) */}
        <section className="text-gray-600 leading-[1.9] font-medium text-xl space-y-12 mb-32">
          {tool.description?.split('\n').filter(Boolean).map((para: string, i: number) => (
            <div 
                key={i} 
                className={i === 0 ? "first-letter:text-8xl first-letter:font-black first-letter:text-gray-900 first-letter:mr-4 first-letter:float-left first-letter:leading-[0.7]" : ""}
                dangerouslySetInnerHTML={{ __html: renderSmartContent(para) }}
            />
          ))}
        </section>

        {/* PROS & CONS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div className="bg-white border border-gray-100 p-12 rounded-[3rem] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600 mb-8 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[10px]">✓</span> Competitive Edge
                </h3>
                <div className="text-gray-500 font-bold text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderSmartContent(tool.pros_cons?.split('Cons:')[0] || "") }} />
            </div>
            <div className="bg-white border border-gray-100 p-12 rounded-[3rem] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-8 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px]">✕</span> Possible Friction
                </h3>
                <div className="text-gray-500 font-bold text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderSmartContent(tool.pros_cons?.split('Cons:')[1] || "") }} />
            </div>
        </section>

        {/* MASTER EXECUTION BUTTON */}
        <div className="mb-40 group">
            <a 
              href={tool.website_url} 
              target="_blank" 
              className="w-full bg-black text-white py-10 rounded-[2.5rem] font-[1000] uppercase tracking-[0.3em] text-sm text-center block shadow-2xl group-hover:bg-blue-600 transition-all duration-500 active:scale-95"
            >
              Start Full Execution ↗
            </a>
        </div>

        {/* FAQ ACCORDION STYLE */}
        {tool.faq && (
          <section className="mb-40">
            <h3 className="text-4xl font-[1000] tracking-tighter mb-16 uppercase italic underline decoration-blue-600 decoration-8 underline-offset-8">Neural FAQ</h3>
            <div className="space-y-6">
                {tool.faq.split('Q:').filter(Boolean).map((item: string, i: number) => {
                    const [q, a] = item.split('A:');
                    return (
                        <div key={i} className="bg-white border border-gray-50 p-10 rounded-[2.5rem] hover:bg-gray-50 transition-colors">
                            <h4 className="font-black text-xl text-gray-900 mb-4 flex gap-4 italic">
                                <span className="text-blue-600 not-italic">Q.</span> {q?.trim()}
                            </h4>
                            <div className="text-gray-500 font-bold text-sm leading-relaxed opacity-80" dangerouslySetInnerHTML={{ __html: renderSmartContent(a || "") }} />
                        </div>
                    );
                })}
            </div>
          </section>
        )}

        {/* RELATED INTELLIGENCE (The Loop) */}
        {related && related.length > 0 && (
          <section className="pt-24 border-t border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-12">Network Alternatives</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {related.map((t) => (
                    <Link key={t.slug} href={`/tool/${t.slug}`} className="group bg-white p-10 rounded-[2.5rem] border border-gray-100 hover:border-blue-600 transition-all shadow-sm">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{t.category}</span>
                        <h4 className="text-xl font-black mt-3 group-hover:text-blue-600 transition-colors line-clamp-1 italic uppercase">{t.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-3 line-clamp-2 leading-relaxed opacity-70 italic">{t.description}</p>
                    </Link>
                ))}
            </div>
          </section>
        )}
      </article>

      <footer className="text-center mt-40 opacity-20 text-[8px] font-black uppercase tracking-[0.6em]">
        VISORA AI ENGINE • BHARAT MISSION 2026
      </footer>
    </main>
  )
}
