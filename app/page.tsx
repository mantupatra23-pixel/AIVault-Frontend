import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// 1. ZAROORI: Ye lines naye tools ko turant frontend par dikhayengi (No Cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string, q?: string }> }) {
  const params = await searchParams;
  const activeCat = params.cat || 'All';
  const searchQuery = params.q || '';

  // 2. SMART QUERY LOGIC
  let query = supabase.from('ai_tools').select('*', { count: 'exact' });

  if (activeCat !== 'All') {
    query = query.ilike('category', `%${activeCat}%`);
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
    <main className="min-h-screen bg-[#fcfcfc] font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Accent Bar */}
      <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0 z-[100]"></div>

      {/* --- HERO SECTION --- */}
      <header className="max-w-7xl mx-auto px-6 pt-32 pb-12 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-100/20 blur-[100px] rounded-full -z-10"></div>
        
        <div className="inline-flex items-center gap-3 bg-white border border-gray-100 px-5 py-2 rounded-full mb-10 shadow-sm border-b-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                {count || 0} AI Tools Live & Verified
            </span>
        </div>
        
        <h1 className="text-7xl md:text-[130px] font-[1000] tracking-[-0.07em] leading-[0.8] mb-12 text-gray-900">
            Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* --- SEARCH ENGINE --- */}
        <form action="/" method="GET" className="max-w-2xl mx-auto mb-16 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-25 transition duration-500"></div>
          <input 
            name="q"
            defaultValue={searchQuery}
            placeholder="Search AI tools (e.g. Chatbot, Video)..." 
            className="relative w-full bg-white border-2 border-gray-50 rounded-[2.2rem] px-12 py-8 text-2xl shadow-2xl outline-none focus:border-blue-600 transition-all font-bold placeholder:text-gray-300"
          />
          {activeCat !== 'All' && <input type="hidden" name="cat" value={activeCat} />}
        </form>

        {/* --- CATEGORY NAVIGATION --- */}
        <div className="flex flex-wrap justify-center gap-3 mb-24">
          {categories.map((c) => (
            <Link 
              key={c.name} 
              href={`/?cat=${c.name}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all font-[1000] text-[10px] uppercase tracking-widest ${
                activeCat === c.name 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200 -translate-y-1' 
                : 'bg-white border-gray-50 text-gray-400 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              <span className="text-lg">{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </header>

      {/* --- TOOLS GRID --- */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-6 mb-16 opacity-30">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] whitespace-nowrap">Latest Intelligence</span>
            <div className="h-px w-full bg-gray-900"></div>
        </div>

        {tools && tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {tools.map((tool) => (
              <Link key={tool.id} href={`/tool/${tool.slug}`} className="group">
                <div className="bg-white border border-gray-100 rounded-[3.8rem] p-12 h-full transition-all duration-700 hover:shadow-[0_60px_100px_-30px_rgba(0,0,0,0.1)] hover:-translate-y-6 relative overflow-hidden">
                  
                  {/* Category & Pricing Tags */}
                  <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
                      <span className={`text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${
                          tool.pricing?.toLowerCase().includes('free') ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'
                      }`}>
                          {tool.pricing || 'Freemium'}
                      </span>
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                          {tool.category}
                      </span>
                  </div>

                  {/* Tool Image/Logo */}
                  <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] mb-12 flex items-center justify-center p-5 border border-gray-50 group-hover:bg-blue-50 transition-colors overflow-hidden shadow-inner">
                      {tool.image_url ? (
                          <img src={tool.image_url} alt={tool.name} className="w-full h-full object-contain" />
                      ) : (
                          <span className="text-4xl font-black text-blue-600 opacity-20">{tool.name[0]}</span>
                      )}
                  </div>

                  <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tighter leading-[0.9] capitalize">
                    {tool.name}<span className="text-blue-600">.</span>
                  </h3>
                  
                  <p className="text-gray-400 text-lg leading-relaxed line-clamp-2 font-medium mb-12">
                    {tool.description?.split('##')[0].replace(/\*/g, '') || 'Next-gen AI system specialized for professional execution.'}
                  </p>

                  <div className="flex items-center justify-between pt-10 border-t border-gray-50">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform">
                        Explore Analysis →
                      </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[4rem]">
              <h3 className="text-4xl font-black text-gray-200 uppercase italic">No tools found. Try searching something else.</h3>
          </div>
        )}
      </section>

      {/* --- NEWSLETTER SECTION --- */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="bg-blue-600 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic">Get The AI Advantage.</h2>
            <p className="text-blue-100 text-xl font-bold mb-12 max-w-xl mx-auto opacity-80 uppercase tracking-widest text-[10px]">Join 10,000+ creators getting daily AI tools alerts.</p>
            <form className="max-w-lg mx-auto flex flex-col md:flex-row gap-4">
                <input type="email" placeholder="Enter your email" className="flex-1 px-8 py-5 rounded-2xl bg-white text-gray-900 font-bold outline-none" />
                <button className="px-10 py-5 rounded-2xl bg-gray-900 text-white font-[1000] uppercase tracking-widest text-xs hover:bg-white hover:text-blue-600 transition-all">Join Vault</button>
            </form>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-100 py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="text-5xl font-black tracking-tighter mb-6">AIVault<span className="text-blue-600">.</span></div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.6em] mb-16">India's Execution-First AI Directory • Built for Bharat</p>
            <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>
      </footer>
    </main>
  )
}
