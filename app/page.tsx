"use client";

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      let query = supabase.from('ai_tools').select('*');
      if (activeCat !== 'All') query = query.ilike('category', activeCat);
      
      const { data } = await query.order('created_at', { ascending: false });
      setTools(data || []);
      setLoading(false);
    }
    fetchTools();
  }, [activeCat]);

  const categories = ['All', 'Chatbot', 'Image Gen', 'Video Gen', 'Coding', 'Marketing', 'Productivity'];

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <nav className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <Link href="/" className="text-2xl font-black italic tracking-tighter uppercase">VISORA<span className="text-blue-600">.</span></Link>
        <div className="text-[10px] font-bold bg-blue-600 text-white px-4 py-2 rounded-full animate-pulse">VAULT LIVE</div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-12 uppercase italic leading-none">
          Vault of<br/><span className="text-blue-600">Intelligence.</span>
        </h1>

        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeCat === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-gray-300 font-bold uppercase tracking-[0.5em] animate-pulse">Syncing Neural Data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {tools.map((tool) => (
              <div key={tool.id} className="border border-gray-100 rounded-[32px] p-8 hover:shadow-2xl transition-all group relative">
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
                <div className="pt-6 border-t flex justify-between items-center text-[10px] font-black">
                  <span className="text-blue-600 tracking-widest">REPORT →</span>
                  <span className="text-gray-300 uppercase tracking-widest">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
