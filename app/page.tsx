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

  const filteredTools = tools.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCat === "All" || t.category === activeCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans">
      {/* Hero Header */}
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-center">
        <h1 className="text-7xl md:text-9xl font-black text-gray-900 tracking-[-0.05em] mb-6">
          AI<span className="text-blue-600">Vault</span>
        </h1>
        <p className="text-xl text-gray-400 font-medium mb-12 italic">Handcrafted by Mantu Patra.</p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 relative group">
          <input
            type="text"
            placeholder="Search 1,000+ AI tools..."
            className="w-full px-8 py-6 rounded-3xl border-2 border-gray-100 focus:border-blue-600 outline-none text-xl font-medium transition-all shadow-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-gray-300">SEARCH</div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-20">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCat === cat ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-400 border border-gray-100 hover:border-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Tools Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTools.map((tool) => (
            <Link href={`/tool/${tool.slug}`} key={tool.id} className="group">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-50 hover:border-blue-600 transition-all hover:shadow-2xl h-full flex flex-col">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">{tool.category}</span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
                <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed mb-8">
                  {tool.description.replace(/\*\*/g, '').replace(/\*/g, '')}
                </p>
                <div className="mt-auto font-black text-[10px] uppercase tracking-[0.2em] text-gray-300 group-hover:text-blue-600 transition-colors">View Review →</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
