import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default async function Home({ searchParams }: any) {
  // Safe extraction for all Next.js versions
  const params = await (searchParams || {});
  const activeCat = params.cat || 'All';
  const searchQuery = params.q || '';

  let query = supabase.from('ai_tools').select('*', { count: 'exact' });
  
  if (activeCat !== 'All') query = query.ilike('category', activeCat);
  if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

  const { data: tools, count } = await query.order('created_at', { ascending: false });

  const categories = [
    { name: 'All', icon: '⚡' }, { name: 'Chatbot', icon: '💬' }, 
    { name: 'Image Gen', icon: '🎨' }, { name: 'Video Gen', icon: '🎥' }, 
    { name: 'Coding', icon: '💻' }, { name: 'Marketing', icon: '📈' }, 
    { name: 'Productivity', icon: '🚀' }
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900">
      <nav className="fixed top-0 w-full h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100 flex items-center justify-between px-6">
        <Link href="/" className="font-[1000] text-2xl tracking-tighter italic">VISORA<span className="text-blue-600">.</span></Link>
        <button className="bg-black text-white text-[10px] px-6 py-3 rounded-full font-bold uppercase tracking-widest">SUBMIT TOOL</button>
      </nav>

      <header className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center">
        <h1 className="text-6xl md:text-[100px] font-[1000] leading-[0.85] tracking-tighter mb-12 uppercase italic">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        <form action="/" method="GET" className="max-w-2xl mx-auto relative mb-12">
          <input name="q" defaultValue={searchQuery} placeholder="Search Neural Engines..." className="w-full px-8 py-6 rounded-3xl bg-white border border-gray-100 shadow-xl outline-none" />
          <button type="submit" className="absolute right-4 top-4 bg-black text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest">EXECUTE</button>
        </form>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Link key={c.name} href={`/?cat=${c.name}`} className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase border ${activeCat === c.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>
              {c.icon} {c.name}
            </Link>
          ))}
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tools?.map((tool) => (
            <div key={tool.id} className="group bg-white border border-gray-100 rounded-[40px] p-8 hover:shadow-2xl transition-all duration-500">
              <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
              <div className="flex justify-between mb-8">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden">
                  <img src={tool.image_url || "https://ai-vault-frontend-blue.vercel.app/neon-logo.png"} alt="" className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = "https://ai-vault-frontend-blue.vercel.app/neon-logo.png" }} />
                </div>
                <span className="bg-black text-[9px] text-white px-3 py-1 rounded-full font-bold">{tool.pricing}</span>
              </div>
              <h3 className="text-2xl font-[1000] mb-2 uppercase italic">{tool.name}.</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-6">{tool.description}</p>
              <div className="pt-6 border-t border-gray-50 flex justify-between">
                <span className="text-[8px] font-black text-blue-600 uppercase">Neural Report →</span>
                <span className="text-[8px] font-black text-slate-300 uppercase">{tool.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
