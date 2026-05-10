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
        let query = supabase.from('ai_tools').select('*').order('created_at', { ascending: false });
        if (activeCat !== 'All') query = query.ilike('category', activeCat);
        const { data, error } = await query;
        if (error) throw error;
        setTools(data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchTools();
  }, [activeCat]);

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(localSearch.toLowerCase()) || 
    t.description.toLowerCase().includes(localSearch.toLowerCase())
  );

  const categories = [
    { name: 'All', icon: '⚡' }, { name: 'Chatbot', icon: '💬' },
    { name: 'Image Gen', icon: '🎨' }, { name: 'Video Gen', icon: '🎥' },
    { name: 'Coding', icon: '💻' }, { name: 'Marketing', icon: '📈' },
    { name: 'Productivity', icon: '🚀' }
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 🧭 PREMIUM NAV */}
      <nav className="fixed top-0 w-full h-20 bg-white/90 backdrop-blur-xl z-[100] border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-[1000] text-2xl tracking-tighter italic uppercase">VISORA<span className="text-blue-600">.</span></Link>
        <div className="hidden lg:flex items-center gap-6">
          {categories.slice(0, 5).map(c => (
            <Link key={c.name} href={`/?cat=${c.name}`} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeCat === c.name ? 'text-blue-600' : 'text-gray-400 hover:text-black'}`}>{c.name}</Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white text-[9px] px-5 py-2.5 rounded-full font-black animate-pulse uppercase tracking-widest shadow-lg shadow-blue-600/20">Vault Live</div>
        </div>
      </nav>

      {/* 🏆 HERO */}
      <header className="max-w-7xl mx-auto px-6 pt-48 pb-20 text-center">
        <h1 className="text-7xl md:text-[145px] font-[1000] leading-[0.8] tracking-tighter mb-12 italic uppercase text-gray-900">Vault of<br/><span className="text-blue-600">Intelligence.</span></h1>
        
        {/* 🔍 SEARCH */}
        <div className="max-w-2xl mx-auto relative mb-16">
          <input type="text" placeholder={`Search through ${tools.length} AI engines...`} onChange={(e) => setLocalSearch(e.target.value)} className="w-full px-10 py-7 rounded-[35px] bg-white border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] outline-none text-xl font-medium focus:ring-4 focus:ring-blue-600/10 transition-all" />
          <div className="absolute right-5 top-5 bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Execute</div>
        </div>

        {/* 🗂️ CATEGORIES */}
        <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
          {categories.map((c) => (
            <Link key={c.name} href={`/?cat=${c.name}`} className={`flex items-center gap-2 px-7 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeCat === c.name ? 'bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-600/30 scale-110' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-600 hover:-translate-y-1'}`}>
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </header>

      {/* 🚀 GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-48">
        <div className="flex items-center gap-6 mb-16"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Neural Sync: {filteredTools.length} results</span><div className="h-px flex-1 bg-gray-100"></div></div>
        {loading ? (
          <div className="text-center py-40 text-xs font-black uppercase tracking-[0.8em] text-gray-200 animate-pulse">Synchronizing...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {filteredTools.map((tool) => (
              <div key={tool.id} className="group bg-white border border-gray-100 rounded-[50px] p-10 hover:shadow-[0_60px_100px_-30px_rgba(0,0,0,0.12)] transition-all duration-700 relative hover:-translate-y-3">
                <Link href={`/tool/${tool.slug}`} className="absolute inset-0 z-10"></Link>
                <div className="flex justify-between items-start mb-10">
                  <div className="w-18 h-18 bg-blue-600 rounded-[24px] flex items-center justify-center text-white text-4xl font-[1000] italic shadow-xl shadow-blue-600/30 group-hover:rotate-6 transition-transform">
                    {tool.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-gray-900 text-[10px] text-white px-5 py-2 rounded-full font-black uppercase">{tool.pricing || 'FREE'}</div>
                </div>
                <h3 className="text-4xl font-[1000] tracking-tighter mb-4 uppercase italic group-hover:text-blue-600 transition-colors leading-none">{tool.name}.</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-10 line-clamp-2 italic font-medium">{tool.description}</p>
                <div className="pt-8 border-t border-gray-50 flex justify-between text-[10px] font-black tracking-widest uppercase italic"><span className="text-blue-600 group-hover:translate-x-3 transition-all">Full Report →</span><span className="text-gray-300">{tool.category}</span></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌐 ADSENSE READY FOOTER */}
      <footer className="bg-white border-t border-gray-100 pt-32 pb-20 text-center">
        <h2 className="text-6xl font-[1000] tracking-tighter mb-8 italic uppercase">VISORA<span className="text-blue-600">.</span></h2>
        
        {/* LEGAL LINKS (Mandatory for Adsense) */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <Link href="/privacy" className="hover:text-blue-600 transition-all">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-blue-600 transition-all">Terms of Service</Link>
          <Link href="/about" className="hover:text-blue-600 transition-all">About Founder</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-all">Contact Us</Link>
        </div>

        <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.5em] mb-4">Made in Bharat for the world</p>
        <p className="text-gray-300 text-[9px] font-medium uppercase tracking-[0.2em] italic">© 2026 Mantu Patra • Founder Core</p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase tracking-[0.8em] text-gray-200">Visora Engine...</div>}>
      <HomeContent />
    </Suspense>
  );
}
