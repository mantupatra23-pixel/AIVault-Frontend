import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// 1. PERFORMANCE & SEO ENGINE
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home({ searchParams }: any) {
  const params = await searchParams;
  const activeCat = params.cat || 'All';
  const searchQuery = params.q || '';

  // 2. SEARCH & FILTER LOGIC
  let query = supabase.from('ai_tools').select('*', { count: 'exact' });
  
  if (activeCat !== 'All') {
    query = query.ilike('category', activeCat);
  }
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: tools, count } = await query.order('created_at', { ascending: false });

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
    <main className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 selection:bg-blue-100">
      
      {/* 🧭 PREMIUM GLASS NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-2xl z-[100] border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-6">
          <Link href="/" className="font-[1000] text-2xl tracking-tighter hover:opacity-70 transition-all italic uppercase">
            VISORA<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 transition-colors">Neural Mission</Link>
            <button className="bg-black text-white text-[10px] px-8 py-3.5 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-500 active:scale-95">
              Submit Engine
            </button>
          </div>
        </div>
      </nav>

      {/* 🏆 HERO SECTION - ULTRA PREMIUM */}
      <header className="max-w-7xl mx-auto px-6 pt-48 pb-24 text-center">
        <div className="inline-flex items-center gap-3 bg-white border border-gray-100 px-5 py-2.5 rounded-full mb-10 shadow-xl shadow-gray-200/50">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping"></span>
          <span className="text-[10px] font-[1000] uppercase tracking-[0.25em] text-gray-500">
            {count || 0} Autonomous Engines Indexing
          </span>
        </div>
        
        <h1 className="text-7xl md:text-[140px] font-[1000] leading-[0.8] tracking-tighter mb-14 italic uppercase">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* 🔍 SEARCH HUB - CLEAN MINIMAL */}
        <form action="/" method="GET" className="max-w-2xl mx-auto relative mb-20 group">
          <input 
            name="q"
            defaultValue={searchQuery}
            placeholder="Search the neural network..." 
            className="w-full px-10 py-7 rounded-[32px] bg-white border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] group-hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.1)] transition-all duration-700 outline-none text-xl font-medium"
          />
          <button type="submit" className="absolute right-4 top-4 bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">Execute</button>
          {activeCat !== 'All' && <input type="hidden" name="cat" value={activeCat} />}
        </form>

        {/* 🗂️ CATEGORY CLUSTERS */}
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {categories.map((c) => (
            <Link 
              key={c.name}
              href={`/?cat=${c.name}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`flex items-center gap-3 px-7 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${
                activeCat === c.name 
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-600/40 scale-110 -translate-y-1' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-600 hover:-translate-y-1'
              }`}
            >
              <span className="text-lg">{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </header>

      {/* 🚀 TOOLS GRID - CARD UPGRADE */}
      <section className="max-w-7xl mx-auto px-6 pb-48">
        <div className="flex items-center gap-8 mb-16">
          <span className="text-[10px] font-[1000] uppercase tracking-[0.3em] text-gray-300">Neural Directory</span>
          <div className="h-px flex-1 bg-gray-100"></div>
        </div>

        {tools && tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {tools.map((tool) => (
              <div key={tool.id} className="group relative bg-white border border-gray-100/50 rounded-[48px] p-10 hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 hover:-translate-y-3">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                
                <div className="flex justify-between items-start mb-10">
                   <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
                    <img 
                      src={tool.image_url || `https://logo.clearbit.com/${tool.name.toLowerCase().replace(/\s/g, '')}.com`} 
                      alt={tool.name} 
                      className="w-full h-full object-contain p-3"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://ai-vault-frontend-blue.vercel.app/neon-logo.png" }}
                    />
                  </div>
                  <div className="bg-gray-900 text-[9px] text-white px-4 py-1.5 rounded-full font-black tracking-widest uppercase shadow-lg shadow-black/10">
                    {tool.pricing}
                  </div>
                </div>

                <h3 className="text-3xl font-[1000] tracking-tighter mb-4 group-hover:text-blue-600 transition-colors uppercase italic leading-none">
                  {tool.name}<span className="text-blue-600">.</span>
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-10 line-clamp-2 italic font-medium">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between pt-8 border-t border-gray-50/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 group-hover:translate-x-2 transition-transform duration-500">Neural Report →</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 italic">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-48 border-[3px] border-dashed border-gray-100 rounded-[60px]">
            <h3 className="text-5xl font-[1000] text-gray-200 uppercase tracking-tighter italic">Awaiting Synchrony...</h3>
          </div>
        )}
      </section>

      {/* 🌐 PREMIUM FOOTER - SEO BOOSTER */}
      <footer className="bg-white border-t border-gray-100 py-48">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-24">
            <div className="md:col-span-2 text-center md:text-left">
              <h2 className="text-6xl font-[1000] tracking-tighter mb-8 italic uppercase">VISORA<span className="text-blue-600">.</span></h2>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-10 italic font-medium">
                Made in Bharat for the world creators. Engineering the next generation of multi-modal AI discovery.
              </p>
              <div className="flex justify-center md:justify-start gap-4">
                 <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer border border-gray-100">𝕏</div>
                 <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer border border-gray-100">in</div>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-10">Neural Hub</h4>
              <ul className="space-y-5 text-xs font-black uppercase tracking-tighter">
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Directory</Link></li>
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">Our Mission</Link></li>
                <li><a href="#" className="text-blue-600">Submit Engine</a></li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-10">Founder Core</h4>
              <ul className="space-y-5 text-xs font-black uppercase tracking-tighter">
                <li><a href="mailto:mantu@visora.ai" className="hover:text-blue-600 transition-colors">Direct Inquiry</a></li>
                <li className="text-gray-400 opacity-50 italic">Mantu Patra • CEO</li>
              </ul>
            </div>
          </div>

          <div className="mt-48 text-center">
            <div className="h-px w-full bg-gray-50 mb-10"></div>
            <p className="text-[8px] font-black text-gray-200 tracking-[0.8em] uppercase italic">
              Visora Neural Engine • Bharat Mission • 2026
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
