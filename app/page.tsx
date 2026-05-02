import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Metadata } from 'next'

// 1. DYNAMIC SEO CONFIGURATION
export const metadata: Metadata = {
  title: 'Visora AI | The World\'s Most Advanced AI Directory',
  description: 'Explore 100+ verified AI tools for video, image, and text automation. Made in Bharat for the global creative economy.',
  keywords: ['AI Tools', 'Visora AI', 'Best AI Directory', 'Artificial Intelligence India'],
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  const params = await searchParams;
  const activeCat = params.cat || 'All';
  const searchQuery = params.q || '';

  // 2. GOOGLE SEARCH ENGINE SCHEMA
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Visora AI",
    "url": "https://ai-vault-frontend-blue.vercel.app/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://ai-vault-frontend-blue.vercel.app/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // 3. NEURAL DATA FETCHING
  let query = supabase.from('ai_tools').select('*', { count: 'exact' })
  if (activeCat !== 'All') { query = query.ilike('category', `%${activeCat}%`) }
  if (searchQuery) { query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`) }
  const { data: tools, count } = await query.order('created_at', { ascending: false })

  const categories = [
    { name: 'All', icon: '⚡' },
    { name: 'Chatbot', icon: '💬' },
    { name: 'Image Gen', icon: '🎨' },
    { name: 'Video Gen', icon: '🎥' },
    { name: 'Coding', icon: '💻' },
    { name: 'Marketing', icon: '📈' },
    { name: 'Productivity', icon: '🚀' }
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] font-sans selection:bg-blue-600 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="h-1.5 bg-blue-600 fixed top-0 left-0 right-0 z-[1000]" />

      {/* --- PREMIUM HERO SECTION --- */}
      <header className="max-w-7xl mx-auto px-6 pt-32 pb-16 text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-50 border border-slate-100 rounded-full mb-10">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {count || 0} Engines Optimized & Verified
            </span>
        </div>
        
        <h1 className="text-7xl md:text-[140px] font-[1000] tracking-tighter leading-[0.75] mb-12 uppercase italic">
            Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* --- DYNAMIC SEARCH --- */}
        <form action="/" method="GET" className="max-w-2xl mx-auto mb-16 relative">
          <input 
            name="q"
            defaultValue={searchQuery}
            autoComplete="off"
            placeholder="Search Autonomous Intelligence..."
            className="w-full px-10 py-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-blue-50 outline-none focus:border-blue-600 transition-all text-xl font-medium italic"
          />
          <button type="submit" className="absolute right-5 top-5 bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600">Search</button>
          {activeCat !== 'All' && <input type="hidden" name="cat" value={activeCat} />}
        </form>

        {/* --- CATEGORY CLUSTERS --- */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {categories.map((c) => (
            <Link 
              key={c.name}
              href={`/?cat=${c.name}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`flex items-center gap-3 px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                activeCat === c.name 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-blue-600'
              }`}
            >
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </header>

      {/* --- TOOLS GRID --- */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center gap-6 mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Neural Discoveries</span>
            <div className="h-px w-full bg-slate-50" />
        </div>

        {tools && tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {tools.map((tool) => (
              <Link key={tool.id} href={`/tool/${tool.slug}`} className="group relative bg-white border border-slate-100 p-10 md:p-12 rounded-[3.5rem] hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.1)] transition-all duration-500 hover:-translate-y-3">
                <div className="absolute top-10 right-10 flex gap-2">
                    <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-4 py-1.5 rounded-full italic tracking-tighter">{tool.pricing || 'Freemium'}</span>
                </div>
                
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 overflow-hidden border border-slate-50">
                    {tool.image_url ? (
                        <img src={tool.image_url} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-[1000] text-slate-200 uppercase">{tool.name[0]}</span>
                    )}
                </div>

                <h3 className="text-4xl font-[1000] text-slate-900 uppercase italic mb-4 leading-none tracking-tighter group-hover:text-blue-600 transition-colors">
                    {tool.name}<span className="text-blue-600">.</span>
                </h3>
                <p className="text-slate-400 text-base leading-relaxed font-medium mb-10 line-clamp-2 italic">
                    {tool.description?.split('.')[0]}.
                </p>

                <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 italic">Analysis Report →</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{tool.category}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-4 border-dashed border-slate-50 rounded-[5rem]">
            <h3 className="text-4xl font-[1000] text-slate-200 uppercase italic">Intelligence Pending...</h3>
          </div>
        )}
      </section>

      {/* --- MASTER FOOTER INDEX (BOT MAGNET) --- */}
      <footer className="bg-white border-t border-slate-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-40">
                <div className="md:col-span-2">
                    <h2 className="text-5xl font-[1000] italic uppercase mb-8 tracking-tighter">VISORA<span className="text-blue-600">.</span></h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed italic max-w-sm">
                        Advancing Bharat's creative economy with autonomous intelligence curation. Verified for performance.
                    </p>
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10 italic">Resources</h4>
                    <ul className="space-y-5 text-[10px] font-black uppercase tracking-widest text-slate-900 italic">
                        <li><Link href="/" className="hover:text-blue-600 transition-colors">AI Directory</Link></li>
                        <li><Link href="/about" className="hover:text-blue-600 transition-colors">The Mission</Link></li>
                        <li><a href="#" className="bg-black text-white px-4 py-2 rounded-xl">Submit Tool</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10 italic">Operations</h4>
                    <ul className="space-y-5 text-[10px] font-black uppercase tracking-widest text-slate-900 italic">
                        <li><a href="mailto:mantu@visora.ai" className="hover:text-blue-600 transition-colors">Inquiry</a></li>
                        <li className="text-blue-600">Bharat HQ</li>
                    </ul>
                </div>
            </div>

            {/* --- SEO NEURAL NETWORK CLUSTER --- */}
            <div className="pt-24 border-t border-slate-50">
                <h4 className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-300 mb-12 text-center italic">Neural Sitemap Cluster</h4>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-5 opacity-20 hover:opacity-100 transition-all duration-700">
                    {tools?.map((t) => (
                        <Link key={t.id} href={`/tool/${t.slug}`} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-tighter">
                            {t.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-40 text-center text-[9px] font-black uppercase tracking-[2em] text-slate-100 pl-10">
                VISORA AI ENGINE • BHARAT 2026
            </div>
        </div>
      </footer>
    </main>
  )
}
