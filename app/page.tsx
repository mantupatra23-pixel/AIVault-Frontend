import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

// Supabase Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function Home(props: any) {
  // Safe extraction for Next.js 14/15
  const searchParams = await (props.searchParams || {});
  const activeCat = searchParams.cat || 'All';
  const searchQuery = searchParams.q || '';

  // Data Fetching
  let query = supabase.from('ai_tools').select('*');
  
  if (activeCat !== 'All') query = query.ilike('category', activeCat);
  if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

  const { data: tools } = await query.order('created_at', { ascending: false });

  const categories = ['All', 'Chatbot', 'Image Gen', 'Video Gen', 'Coding', 'Marketing', 'Productivity'];

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* Navbar */}
      <nav className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link href="/" className="text-2xl font-black italic tracking-tighter">VISORA<span className="text-blue-600">.</span></Link>
        <div className="text-[10px] font-bold bg-black text-white px-4 py-2 rounded-full">FOUNDER MODE</div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 uppercase italic leading-none">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* Search */}
        <form action="/" method="GET" className="max-w-xl mx-auto mb-12">
          <input 
            name="q" 
            defaultValue={searchQuery}
            placeholder="Search AI Engines..." 
            className="w-full p-6 rounded-2xl border-2 border-gray-100 focus:border-blue-600 outline-none transition-all shadow-lg text-lg"
          />
        </form>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Link 
              key={cat} 
              href={`/?cat=${cat}`}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeCat === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-600'}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tools?.map((tool: any) => (
            <div key={tool.id} className="border-2 border-gray-50 rounded-[32px] p-8 hover:border-blue-600 transition-all group relative">
              <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden p-2">
                  <img 
                    src={tool.image_url || "https://ai-vault-frontend-blue.vercel.app/neon-logo.png"} 
                    alt="" 
                    className="w-full h-full object-contain"
                    onError={(e: any) => { e.target.src = "https://ai-vault-frontend-blue.vercel.app/neon-logo.png" }}
                  />
                </div>
                <span className="text-[10px] font-bold bg-gray-100 px-3 py-1 rounded-full uppercase">{tool.pricing}</span>
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase italic">{tool.name}.</h3>
              <p className="text-gray-400 text-sm line-clamp-2 mb-6 italic">{tool.description}</p>
              <div className="pt-6 border-t flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-600">REPORT →</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase">{tool.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
