import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// 1. PERFORMANCE ENGINE
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

  // 2. SEARCH & FILTER LOGIC
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
      
      {/* 🧭 PREMIUM STICKY NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center z-[10000] px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase flex items-center gap-1">
              VISORA<span className="text-blue-600">.</span>
            </Link>
            <div className="flex items-center gap-4">
                <Link href="/about" className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Mission</Link>
                <a href="#" className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">Submit Tool</a>
            </div>
        </div>
      </nav>

      {/* 🏆 HERO SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-8 border border-blue-100">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-[1000] uppercase tracking-widest text-blue-600">
                {count || 0} Neural Engines Verified
            </span>
        </div>
        
        <h1 className="text-6xl md:text-[130px] font-[1000] tracking-tighter leading-[0.8] mb-12 uppercase italic">
            Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* 🔍 SEARCH HUB */}
        <form action="/" method="GET" className="max-w-2xl mx-auto mb-16 relative group">
          <input 
            name="q"
            defaultValue={searchQuery}
            placeholder="Search Autonomous Intelligence..."
            className="w-full px-8 py-6 rounded-3xl bg-white border border-slate-100 shadow-2xl shadow-blue-100/30 outline-none focus:border-blue-600 transition-all text-lg font-medium italic"
          />
          <button type="submit" className="absolute right-4 top-4 bg-black text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest">Execute</button>
          {activeCat !== 'All' && <input type="hidden" name="cat" value={activeCat} />}
        </form>

        {/* 🗂️ CATEGORY CLUSTERS */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Link 
              key={c.name}
              href={`/?cat=${c.name}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[9px] font-[1000] uppercase tracking-[0.15em] border transition-all ${
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

      {/* 🚀 TOOLS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center gap-6 mb-16 opacity-30">
            <span className="text-[10px] font-[1000] uppercase tracking-[0.5em] italic">Verified Directory</span>
            <div className="h-px w-full bg-slate-900" />
        </div>

        {tools && tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <Link key={tool.id} href={`/tool/${tool.slug}`} className="group relative bg-white border border-slate-100 p-10 rounded-[3rem] hover:shadow-2xl hover:shadow-blue-100 transition-all hover:-translate-y-3">
                <div className="absolute top-8 right-8">
                    <span className="text-[8px] font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-full italic tracking-tighter">{tool.pricing || 'Freemium'}</span>
                </div>
                
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 overflow-hidden">
                    {tool.image_url ? (
                        <img src={tool.image_url} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl font-[1000] text-slate-200 uppercase">{tool.name[0]}</span>
                    )}
                </div>

                <h3 className="text-3xl font-[1000] text-slate-900 uppercase italic mb-4 leading-none tracking-tighter group-hover:text-blue-600 transition-colors">
                    {tool.name}<span className="text-blue-600">.</span>
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium mb-8 line-clamp-2 italic">
                    {tool.description?.split('.')[0]}.
                </p>

                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 italic">Neural Report →</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">{tool.category}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-4 border-dashed border-slate-50 rounded-[5rem]">
            <h3 className="text-4xl font-[1000] text-slate-200 uppercase italic">Awaiting Data...</h3>
          </div>
        )}
      </section>

      {/* 🌐 NEURAL SITEMAP INDEX (SEO BOOSTER) */}
      <footer className="bg-white border-t border-slate-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
                <div className="md:col-span-2 text-center md:text-left">
                    <h2 className="text-5xl font-[1000] italic uppercase mb-8 tracking-tighter">VISORA<span className="text-blue-600">.</span></h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed italic max-w-sm mx-auto md:mx-0">
                        Made in Bharat for the world. Curating 100+ high-performance AI engines for the next 10Cr creators.
                    </p>
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8 italic">Company</h4>
                    <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-900 italic">
                        <li><Link href="/" className="hover:text-blue-600">Directory</Link></li>
                        <li><Link href="/about" className="hover:text-blue-600">Mission</Link></li>
                        <li><a href="#" className="hover:text-blue-600 text-blue-600">Submit Tool</a></li>
                    </ul>
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8 italic">Founder</h4>
                    <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-900 italic">
                        <li><a href="mailto:mantu@visora.ai" className="hover:text-blue-600 underline">Inquiry</a></li>
                        <li className="text-slate-400">© 2026 Bharat Made</li>
                    </ul>
                </div>
            </div>

            {/* THE BOT MAGNET (82 TOOLS LINKS) */}
            <div className="pt-24 border-t border-slate-100">
                <h4 className="text-[9px] font-black uppercase tracking-[0.8em] text-slate-300 mb-12 text-center italic">Neural Cluster Network</h4>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-5 opacity-60 hover:opacity-100 transition-opacity duration-700">
                    {tools?.map((t) => (
                        <Link key={t.id} href={`/tool/${t.slug}`} className="text-[9px] font-[1000] text-slate-600 hover:text-blue-600 uppercase tracking-tighter">
                            {t.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-40 text-center text-[9px] font-black uppercase tracking-[2em] text-slate-200">
                VISORA AI ENGINE • BHARAT MISSION
            </div>
        </div>
      </footer>
    </main>
  )
}
