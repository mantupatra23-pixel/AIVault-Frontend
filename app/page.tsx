import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  // Database se tools mangwao
  const { data: tools } = await supabase
    .from('ai_tools')
    .select('*')
    .order('created_at', { ascending: false })

  const categories = ["All", "Chatbot", "Image Gen", "Video Gen", "Writing", "Marketing", "Assistant"];

  return (
    <main className="min-h-screen bg-white">
      {/* 🚀 HERO SECTION: 10Cr Traffic Start Here */}
      <section className="pt-20 pb-16 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-gray-900">
          AI<span className="text-blue-600">Vault</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-medium">
          The World’s smartest AI directory. Curated, reviewed, and ranked by AI.
        </p>
        
        {/* 🔍 SEARCH BAR (Static for UI) */}
        <div className="mt-10 max-w-xl mx-auto relative">
          <input 
            type="text" 
            placeholder="Search 1,000+ AI tools..." 
            className="w-full px-8 py-5 rounded-2xl border border-gray-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <button className="absolute right-4 top-4 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold">Search</button>
        </div>
      </section>

      {/* 🏷️ CATEGORY FILTERS */}
      <nav className="flex flex-wrap justify-center gap-3 px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        {categories.map((cat) => (
          <button key={cat} className="px-5 py-2 rounded-full border border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-bold text-sm text-gray-700">
            {cat}
          </button>
        ))}
      </nav>

      {/* ⚡ TOOLS GRID */}
      <section className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-gray-900">Latest Discoveries</h2>
          <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-black uppercase">
            {tools?.length || 0} Tools Found
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools && tools.length > 0 ? (
            tools.map((tool) => (
              <Link href={`/tool/${tool.slug}`} key={tool.id} className="group">
                <div className="h-full bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                        {tool.category}
                      </span>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <span className="text-gray-400 group-hover:text-white text-xl">↗</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-gray-500 line-clamp-3 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-50">
                    <span className="text-blue-600 font-bold text-sm">View Full Review →</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-xl uppercase tracking-widest italic">The Vault is empty. Run the Engine!</p>
            </div>
          )}
        </div>
      </section>

      {/* 🚀 FOOTER */}
      <footer className="mt-20 py-20 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-black mb-4">AI<span className="text-blue-500">Vault</span></h2>
        <p className="text-gray-400 max-w-md mx-auto mb-10">Building the future of AI discovery, one tool at a time.</p>
        <div className="text-xs text-gray-500 font-medium">
          &copy; 2026 AIVault Engine | Built by Mantu Patra
        </div>
      </footer>
    </main>
  )
}
