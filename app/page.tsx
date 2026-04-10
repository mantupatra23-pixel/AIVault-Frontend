"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [tools, setTools] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => {
    async function fetchTools() {
      const { data } = await supabase.from("ai_tools").select("*");
      if (data) setTools(data);
    }
    fetchTools();
  }, []);

  const categories = ["All", "Chatbot", "Image Gen", "Video Gen", "Writing", "Coding", "Marketing"];

  const filtered = tools.filter((t: any) => {
    const s = t.name.toLowerCase().includes(search.toLowerCase());
    const c = activeCat === "All" || t.category === activeCat;
    return s && c;
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <header className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
        <h2 className="text-6xl md:text-8xl font-black text-gray-900 tracking-[-0.05em] mb-6">
          Find Your Next <br/><span className="text-blue-600 underline decoration-gray-100">AI Power.</span>
        </h2>
        
        <div className="max-w-2xl mx-auto mt-12 mb-10 relative">
          <input
            type="text"
            placeholder="Search AI tools..."
            className="w-full px-8 py-6 rounded-3xl border-2 border-gray-100 outline-none text-xl shadow-sm focus:border-blue-600 transition-all bg-white"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCat === cat ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-400 border border-gray-100 hover:border-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((tool: any) => (
            <Link href={`/tool/${tool.slug}`} key={tool.id} className="group">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-50 hover:border-blue-600 transition-all hover:shadow-2xl h-full flex flex-col">
                
                {/* SAFE IMAGE HANDLING */}
                <div className="w-14 h-14 mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center relative shadow-inner">
                  {tool.image_url ? (
                    <img 
                      src={tool.image_url} 
                      alt={tool.name} 
                      className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) parent.innerHTML = `<span class="text-xl font-black text-blue-600 opacity-30">${tool.name.charAt(0)}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-xl font-black text-blue-600 opacity-30">{tool.name.charAt(0)}</span>
                  )}
                </div>

                <span className="text-[10px] font-black text-blue-600 uppercase mb-4 block tracking-widest">{tool.category}</span>
                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
                <p className="text-gray-400 line-clamp-2 text-sm mb-8 font-medium italic">
                  {tool.description.replace(/\*/g, '').slice(0, 100)}...
                </p>
                <div className="mt-auto font-black text-[10px] uppercase text-gray-300 group-hover:text-blue-600 tracking-widest transition-colors">View Analysis →</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
