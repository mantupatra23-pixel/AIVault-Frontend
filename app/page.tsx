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
    <main className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 selection:bg-blue-100">
      
      {/* 🧭 PREMIUM STICKY NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-6">
          <Link href="/" className="font-[1000] text-2xl tracking-tighter hover:opacity-70 transition-all">
            VISORA<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black">MISSION</Link>
            <a href="#" className="bg-black text-white text-[10px] px-6 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-black/10">SUBMIT TOOL</a>
          </div>
        </div>
      </nav>

      {/* 🏆 HERO SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-full mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-[10px] font-[1000] uppercase tracking-widest text-gray-500">
             {count || 0} Neural Engines Verified
          </span>
        </div>
        
        <h1 className="text-6xl md:text-[130px] font-[1000] leading-[0.85] tracking-tighter mb-12 uppercase">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* 🔍 SEARCH HUB */}
        <form action="/" method="GET" className="max-w-2xl mx-auto relative mb-16">
          <input 
            name="q"
            defaultValue={searchQuery}
            placeholder="Search Autonomous Intelligence..." 
            className="w-full px-8 py-6 rounded-3xl bg-white border border-gray-100 shadow-2xl shadow-black/5 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-lg font-medium"
          />
          <button type="submit" className="absolute right-4 top-4 bg-black text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">EXECUTE</button>
          {activeCat !== 'All' && <input type="hidden" name="cat" value={activeCat} />}
        </form>

        {/* 🗂️ CATEGORY CLUSTERS */}
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {categories.map((c) => (
            <Link 
              key={c.name}
              href={`/?cat=${c.name}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                activeCat === c.name 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </header>

      {/* 🚀 TOOLS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center gap-6 mb-12">
          <span className="text-[10px] font-[1000] uppercase tracking-widest text-gray-300">Verified Directory</span>
          <div className="h-px w-full bg-slate-900/5"></div>
        </div>

        {tools && tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="group relative bg-white border border-gray-100 rounded-[40px] p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-700">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                
                <div className="flex justify-between items-start mb-8">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-50">
                    <img 
                      src={tool.image_url || "https://ai-vault-frontend-blue.vercel.app/neon-logo.png"} 
                      alt={tool.name} 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://ai-vault-frontend-blue.vercel.app/neon-logo.png" }}
                    />
                  </div>
                  <div className="bg-black text-[9px] text-white px-3 py-1 rounded-full font-bold tracking-widest uppercase">
                    {tool.pricing}
                  </div>
                </div>

                <h3 className="text-3xl font-[1000] tracking-tighter mb-3 group-hover:text-blue-600 transition-colors uppercase">
                  {tool.name}<span className="text-blue-600">.</span>
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2 italic">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600">Neural Report →</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-4 border-dashed border-gray-50 rounded-[60px]">
            <h3 className="text-4xl font-[1000] text-gray-200 uppercase tracking-tighter">Awaiting Data...</h3>
          </div>
        )}
      </section>

      {/* 🌐 FOOTER & SEO LINKS */}
      <footer className="bg-white border-t border-slate-100 py-40">
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="md:col-span-2">
              <h2 className="text-5xl font-[1000] tracking-tighter mb-6">VISORA<span className="text-blue-600">.</span></h2>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
                Made in Bharat for the world. Curating 100+ high-performance AI engines for the next 10Cr creators.
              </p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 Bharat Made</p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-tighter">
                <li><Link href="/" className="hover:text-blue-600">Directory</Link></li>
                <li><Link href="/about" className="hover:text-blue-600">Mission</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8">Contact</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-tighter">
                <li><a href="mailto:mantu@visora.ai" className="hover:text-blue-600">Founder Inquiry</a></li>
                <li className="text-slate-400 text-[10px] tracking-widest font-medium italic">Mantu Patra CEO</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
