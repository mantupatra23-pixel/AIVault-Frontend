"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
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
    <div className="bg-[#fcfcfc] min-h-screen">
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-center">
        <h1 className="text-7xl md:text-9xl font-black text-gray-900 mb-6">
          AI<span className="text-blue-600">Vault</span>
        </h1>
        <div className="max-w-2xl mx-auto mb-12">
          <input
            type="text"
            placeholder="Search AI tools..."
            className="w-full px-8 py-6 rounded-3xl border-2 border-gray-100 outline-none text-xl shadow-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-20">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                activeCat === cat ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((tool: any) => (
            <Link href={`/tool/${tool.slug}`} key={tool.id}>
              <div className="bg-white p-8 rounded-[2rem] border border-gray-50 hover:border-blue-600 transition-all h-full">
                <span className="text-[10px] font-black text-blue-600 uppercase mb-4 block">{tool.category}</span>
                <h3 className="text-3xl font-black text-gray-900 mb-4">{tool.name}</h3>
                <p className="text-gray-400 line-clamp-3 text-sm mb-8">{tool.description.replace(/\*/g, '')}</p>
                <div className="font-black text-[10px] uppercase text-gray-300">View Review →</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
