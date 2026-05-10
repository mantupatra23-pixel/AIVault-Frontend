"use client";

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Supabase Safe Initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

function HomeContent() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const activeCat = searchParams.get('cat') || 'All';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        let query = supabase.from('ai_tools').select('*');
        
        if (activeCat !== 'All') {
          query = query.ilike('category', activeCat);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Frontend search filter (Very safe)
        let filteredData = data || [];
        if (searchQuery) {
          filteredData = filteredData.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setTools(filteredData);
      } catch (err) {
        console.error("Neural Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, [activeCat, searchQuery]);

  const categories = ['All', 'Chatbot', 'Image Gen', 'Video Gen', 'Coding', 'Marketing', 'Productivity'];

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 font-sans">
      {/* 🧭 NAV */}
      <nav className="fixed top-0 w-full h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100 flex items-center justify-between px-6">
        <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">VISORA<span className="text-blue-600">.</span></Link>
        <div className="bg-blue-600 text-white text-[9px] px-4 py-2 rounded-full font-black animate-pulse uppercase tracking-widest">Vault Live</div>
      </nav>

      {/* 🏆 HERO */}
      <header className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center">
        <h1 className="text-6xl md:text-[120px] font-[1000] leading-[0.8] tracking-tighter mb-12 italic uppercase">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {categories.map((cat) => (
            <Link 
              key={cat}
              href={`/?cat=${cat}`}
              className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeCat === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </header>

      {/* 🚀 GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        {loading ? (
          <div className="text-center py-20 text-xs font-black text-gray-300 animate-pulse uppercase tracking-widest">Neural Syncing...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="group bg-white border border-gray-100 rounded-[40px] p-8 hover:shadow-2xl transition-all duration-500 relative">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-[1000] italic shadow-lg shadow-blue-600/10">
                    {tool.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="bg-black text-[9px] text-white px-3 py-1 rounded-full font-bold uppercase">{tool.pricing}</span>
                </div>
                <h3 className="text-3xl font-[1000] tracking-tighter mb-3 uppercase italic group-hover:text-blue-600 leading-none">{tool.name}.</h3>
                <p className="text-gray-400 text-sm line-clamp-2 italic mb-8 font-medium">{tool.description}</p>
                <div className="pt-6 border-t border-gray-50 flex justify-between text-[9px] font-black tracking-widest uppercase italic">
                  <span className="text-blue-600">Report →</span>
                  <span className="text-gray-300">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// 🛡️ CRITICAL FIX: Next.js searchParams must be wrapped in Suspense
export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase tracking-[0.5em] text-gray-200">Visora Engine...</div>}>
      <HomeContent />
    </Suspense>
  );
}
