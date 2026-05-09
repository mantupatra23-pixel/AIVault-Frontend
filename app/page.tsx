"use client";

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// 1. DONT CHANGE THESE - Standard Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');

  // 2. BACKEND & LOGO LOGIC
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
        setTools(data || []);
      } catch (err) {
        console.error("Neural Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, [activeCat]);

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 font-sans selection:bg-blue-100">
      
      {/* 🧭 NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-6">
          <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">
            VISORA<span className="text-blue-600">.</span>
          </Link>
          <div className="bg-blue-600 text-white text-[9px] px-4 py-2 rounded-full font-black animate-pulse uppercase tracking-widest">Vault Live</div>
        </div>
      </nav>

      {/* 🏆 HERO */}
      <header className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center">
        <h1 className="text-7xl md:text-[140px] font-[1000] leading-[0.8] tracking-tighter mb-12 italic uppercase">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-16">
          {['All', 'Chatbot', 'Image Gen', 'Video Gen', 'Coding', 'Marketing', 'Productivity'].map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-[1000] uppercase tracking-widest transition-all border ${
                activeCat === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-100 text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* 🚀 TOOLS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        {loading ? (
          <div className="text-center py-20 text-xs font-black text-gray-300 animate-pulse uppercase tracking-widest">Neural Syncing...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="group bg-white border border-gray-100 rounded-[40px] p-8 hover:shadow-2xl transition-all duration-500 relative">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-all">
                    <img 
                      src={`https://logo.clearbit.com/${tool.link?.replace('https://','').replace('http://','').split('/')[0]}`} 
                      alt="" 
                      className="w-10 h-10 object-contain"
                      onError={(e: any) => { e.target.src = "https://ai-vault-frontend-blue.vercel.app/neon-logo.png" }} 
                    />
                  </div>
                  <span className="bg-black text-[9px] text-white px-3 py-1 rounded-full font-bold uppercase">{tool.pricing}</span>
                </div>

                <h3 className="text-3xl font-[1000] tracking-tighter mb-3 uppercase italic group-hover:text-blue-600">{tool.name}.</h3>
                <p className="text-gray-400 text-sm line-clamp-2 italic mb-8">{tool.description}</p>

                <div className="pt-6 border-t border-gray-50 flex justify-between text-[9px] font-black tracking-widest uppercase">
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
