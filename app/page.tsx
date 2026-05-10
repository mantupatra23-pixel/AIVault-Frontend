"use client";

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

function HomeContent() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  
  const activeCat = searchParams.get('cat') || 'All';

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        let query = supabase.from('ai_tools').select('*');
        if (activeCat !== 'All') query = query.ilike('category', activeCat);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        setTools(data || []);
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, [activeCat]);

  // 🔍 Real-time Search Filter
  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(localSearch.toLowerCase()) || 
    t.description.toLowerCase().includes(localSearch.toLowerCase())
  );

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
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 NAVIGATION */}
      <nav className="fixed top-0 w-full h-20 bg-white/80 backdrop-blur-xl z-[100] border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">
          VISORA<span className="text-blue-600">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:block bg-blue-50 text-blue-600 text-[10px] px-4 py-2 rounded-full font-black tracking-widest uppercase italic">Neural Network Active</div>
          <div className="bg-blue-600 text-white text-[9px] px-4 py-2 rounded-full font-black animate-pulse uppercase tracking-widest">Vault Live</div>
        </div>
      </nav>

      {/* 🏆 HERO SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-44 pb-20 text-center">
        <h1 className="text-7xl md:text-[140px] font-[1000] leading-[0.8] tracking-tighter mb-12 italic uppercase text-gray-900">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* 🔍 SEARCH HUB */}
        <div className="max-w-2xl mx-auto relative mb-16 group">
          <input 
            type="text"
            placeholder="Search Autonomous Intelligence..." 
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full px-8 py-6 rounded-[32px] bg-white border border-gray-100 shadow-2xl shadow-black/5 outline-none text-lg font-medium focus:ring-4 focus:ring-blue-600/10 transition-all"
          />
          <div className="absolute right-4 top-4 bg-black text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Execute</div>
        </div>

        {/* 🗂️ CATEGORY CLUSTERS */}
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {categories.map((c) => (
            <Link 
              key={c.name}
              href={`/?cat=${c.name}`}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-[1000] uppercase tracking-widest transition-all border ${
                activeCat === c.name 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 scale-110' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </header>

      {/* 🚀 TOOLS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Verified Neural Engines</span>
          <div className="h-px flex-1 bg-gray-100"></div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs font-black text-gray-300 animate-pulse uppercase tracking-[0.5em]">Syncing Neural Data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredTools.map((tool) => (
              <div key={tool.id} className="group bg-white border border-gray-100 rounded-[48px] p-10 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 relative hover:-translate-y-2">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                
                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-[1000] italic shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform duration-500">
                    {tool.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-gray-900 text-[9px] text-white px-4 py-1.5 rounded-full font-black tracking-widest uppercase">
                    {tool.pricing}
                  </div>
                </div>

                <h3 className="text-3xl font-[1000] tracking-tighter mb-4 uppercase italic group-hover:text-blue-600 transition-colors leading-none">
                  {tool.name}.
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-10 line-clamp-2 italic font-medium">
                  {tool.description}
                </p>

                <div className="pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] font-black tracking-widest uppercase italic">
                  <span className="text-blue-600 group-hover:translate-x-2 transition-transform duration-500">Report →</span>
                  <span className="text-gray-300">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌐 FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-24 text-center">
        <h2 className="text-5xl font-[1000] tracking-tighter mb-6 italic uppercase">VISORA<span className="text-blue-600">.</span></h2>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Made in Bharat for the world</p>
        <p className="text-gray-300 text-[9px] font-medium uppercase tracking-widest italic">© 2026 Mantu Patra • AI Founder Core</p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase tracking-[0.8em] text-gray-200 animate-pulse">Initializing...</div>}>
      <HomeContent />
    </Suspense>
  );
}
