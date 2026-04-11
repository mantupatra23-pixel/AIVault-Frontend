import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  // Fetch Tools + Total Count for Stats
  const { data: tools, count } = await supabase
    .from('ai_tools')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const categories = [
    { name: 'All', icon: '⚡' },
    { name: 'Chatbot', icon: '💬' },
    { name: 'Image Gen', icon: '🎨' },
    { name: 'Video Gen', icon: '🎥' },
    { name: 'Coding', icon: '💻' },
    { name: 'Marketing', icon: '📈' }
  ];

  return (
    <main className="min-h-screen bg-[#f8f9fb] font-sans selection:bg-blue-600 selection:text-white">
      <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0 z-50"></div>

      {/* --- HERO SECTION --- */}
      <header className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-100/30 blur-[120px] rounded-full -z-10"></div>

        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white border border-gray-100 px-5 py-2 rounded-full shadow-sm mb-10">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              {count || 0} Tools Indexed & Verified
            </span>
          </div>
          
          <h1 className="text-8xl md:text-[140px] font-[1000] tracking-[-0.06em] leading-[0.8] mb-12 text-gray-900">
            Vault of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Intelligence.</span>
          </h1>

          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <input 
              type="text" 
              placeholder="Search 1,000+ AI tools by name or category..." 
              className="relative w-full bg-white border-none rounded-[2rem] px-12 py-8 text-2xl shadow-2xl outline-none font-bold placeholder:text-gray-300"
            />
          </div>
        </div>
      </header>

      {/* --- CATEGORY NAV --- */}
      <nav className="max-w-7xl mx-auto px-6 mb-20">
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <button key={cat.name} className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-gray-100 font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100 transition-all active:scale-95">
              <span className="text-xl">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* --- TOOLS GRID --- */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center justify-between mb-12 px-4">
            <h3 className="text-2xl font-black tracking-tighter uppercase italic text-gray-400">Latest Additions</h3>
            <div className="h-px flex-1 bg-gray-100 mx-8"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Auto-updating Live</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {tools?.map((tool) => (
            <Link key={tool.id} href={`/tool/${tool.slug}`} className="group">
              <div className="bg-white border border-gray-100 rounded-[3.5rem] p-12 h-full transition-all duration-700 hover:shadow-[0_60px_100px_-30px_rgba(0,0,0,0.08)] hover:-translate-y-6 relative overflow-hidden">
                
                {/* Price Tag Overlay */}
                <div className="absolute top-8 right-8">
                    <span className={`text-[9px] font-[1000] px-3 py-1 rounded-lg uppercase tracking-wider border ${
                        tool.pricing?.toLowerCase().includes('free') ? 'bg-green-500 text-white border-green-500' : 'bg-gray-900 text-white border-gray-900'
                    }`}>
                        {tool.pricing || 'Freemium'}
                    </span>
                </div>

                <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] mb-10 flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 transition-colors duration-500 overflow-hidden p-4">
                    {tool.image_url ? (
                        <img src={tool.image_url} alt={tool.name} className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-4xl font-black text-blue-600 opacity-10">{tool.name.charAt(0)}</span>
                    )}
                </div>

                <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tight leading-none capitalize">
                  {tool.name}<span className="text-blue-600">.</span>
                </h3>
                
                <p className="text-gray-500 text-lg leading-relaxed line-clamp-2 font-medium mb-10">
                  {tool.description?.split('##')[0].replace(/\*/g, '') || 'High-performance AI engine for modern creators.'}
                </p>

                <div className="flex items-center justify-between mt-auto pt-8 border-t border-gray-50">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{tool.category}</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Full Review →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 py-32 text-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
            <div className="text-5xl font-black tracking-tighter mb-8">AIVault<span className="text-blue-600">.</span></div>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-12">
                <Link href="#" className="hover:text-blue-500">Directory</Link>
                <Link href="#" className="hover:text-blue-500">Submission</Link>
                <Link href="#" className="hover:text-blue-500">Mission</Link>
            </div>
            <p className="text-gray-600 text-[9px] uppercase tracking-[0.5em]">© 2026 AI VAULT ENGINE • BHARAT</p>
        </div>
      </footer>
    </main>
  )
}
