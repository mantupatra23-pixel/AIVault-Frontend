"use client";

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Supabase Safe Initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');

  // 1. NEURAL DATA FETCHING ENGINE
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

  const categories = ['All', 'Chatbot', 'Image Gen', 'Video Gen', 'Coding', 'Marketing', 'Productivity'];

  // 2. LOGO ENGINE: Instant Domain Extraction
  const getLogo = (tool: any) => {
    if (tool.image_url && tool.image_url.includes('http')) return tool.image_url;
    try {
      // Direct Clearbit fetch using hostname from link
      const domain = new URL(tool.link).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      return "https://ai-vault-frontend-blue.vercel.app/neon-logo.png";
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 selection:bg-blue-100 font-sans">
      
      {/* 🧭 PREMIUM NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-6">
          <Link href="/" className="font-[1000] text-2xl tracking-tighter hover:opacity-70 transition-all italic">
            VISORA<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white text-[9px] px-4 py-2 rounded-full font-black tracking-widest animate-pulse uppercase">Vault Live</div>
          </div>
        </div>
      </nav>

      {/* 🏆 HERO SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center">
        <h1 className="text-7xl md:text-[140px] font-[1000] leading-[0.8] tracking-tighter mb-12 italic uppercase">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        {/* 🗂️ CATEGORY CLUSTERS */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-16">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-[1000] uppercase tracking-widest transition-all duration-300 border ${
                activeCat === cat 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 scale-110' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-blue-600 hover:text-blue-600'
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
          <div className="text-center py-40">
            <div className="text-xs font-black uppercase tracking-[0.5em] text-gray-300 animate-pulse">Syncing Neural Data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="group relative bg-white border border-gray-100 rounded-[40px] p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                
                <div className="flex justify-between items-start mb-8">
                   <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                    <img 
                      src={getLogo(tool)} 
                      alt="" 
                      className="w-10 h-10 object-contain"
                      onError={(e: any) => { e.target.src = "https://ai-vault-frontend-blue.vercel.app/neon-logo.png" }}
                    />
                  </div>
                  <div className="bg-black text-[9px] text-white px-3 py-1 rounded-full font-bold tracking-widest uppercase">
                    {tool.pricing}
                  </div>
                </div>

                <h3 className="text-3xl font-[1000] tracking-tighter mb-3 group-hover:text-blue-600 transition-colors uppercase italic">
                  {tool.name}.
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-2 italic">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 italic">Neural Report →</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 italic">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌐 FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-20 text-center">
        <h2 className="text-4xl font-[1000] tracking-tighter mb-4 italic">VISORA<span className="text-blue-600">.</span></h2>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          © 2026 Bharat Made • Mantu Patra CEO
        </p>
      </footer>
    </main>
  )
}
