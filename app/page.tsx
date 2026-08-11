"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ToolLogo } from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

function HomeContent() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<any[]>([]);
  const [globalTotalCount, setGlobalTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");

  const activeCat = searchParams.get("cat") || "All";

  useEffect(() => {
    async function fetchToolsAndCount() {
      setLoading(true);
      try {
        // 1. Query exact canonical database total count (bypasses pagination & category filters)
        const { count: exactDbCount, error: countErr } = await supabase
          .from("ai_tools")
          .select("id", { count: "exact", head: true });

        if (!countErr && typeof exactDbCount === "number") {
          setGlobalTotalCount(exactDbCount);
        }

        // 2. Query directory tools list
        let query = supabase.from("ai_tools").select("*");
        if (activeCat !== "All") {
          query = query.ilike("category", `%${activeCat}%`);
        }
        const { data, error } = await query;
        if (error) throw error;

        const rawData = data || [];
        // Deduplicate records by unique tool slug
        const uniqueMap = new Map<string, any>();
        for (const t of rawData) {
          const key = (t.slug || t.name || "").toLowerCase().trim();
          if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, t);
          }
        }
        const uniqueList = Array.from(uniqueMap.values());
        setTools(uniqueList);

        // Fallback calculation if head count query was blocked
        if (globalTotalCount === 0) {
          setGlobalTotalCount(uniqueList.length);
        }
      } catch (err) {
        console.error("[HOME_FETCH_ERR]", err);
      } finally {
        setLoading(false);
      }
    }

    fetchToolsAndCount();
  }, [activeCat]);

  // Filter tools for UI display without mutating the canonical directory total
  const filteredTools = tools.filter((t) => {
    const term = localSearch.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = t.name?.toLowerCase().includes(term);
    const descMatch = t.description?.toLowerCase().includes(term);
    const catMatch = t.category?.toLowerCase().includes(term);
    return nameMatch || descMatch || catMatch;
  });

  const categories = [
    { name: "All", icon: "⚡" },
    { name: "Chatbot", icon: "🤖" },
    { name: "Coding", icon: "💻" },
    { name: "Image", icon: "🎨" },
    { name: "Writing", icon: "✍️" },
    { name: "Audio", icon: "🎵" },
    { name: "Video", icon: "🎬" },
  ];

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Vault",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <main className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans">
        {/* 🧭 NAVIGATION */}
        <nav className="fixed top-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 sm:px-12">
          <Link href="/" className="font-[1000] text-2xl tracking-tighter">
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600 uppercase tracking-widest">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.name}
                href={c.name === "All" ? "/" : `/?cat=${encodeURIComponent(c.name)}`}
                className={`hover:text-blue-600 transition ${
                  activeCat === c.name ? "text-blue-600 font-black" : ""
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md shadow-blue-500/20">
              {globalTotalCount > 0 ? `${globalTotalCount}+ ENGINES` : "AI DIRECTORY"}
            </div>
          </div>
        </nav>

        {/* 🏆 HERO HEADER */}
        <header className="max-w-7xl mx-auto px-6 pt-36 pb-12 text-center space-y-6">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-[1000] tracking-tighter text-slate-900 leading-none">
            Discover the World's <br />
            <span className="text-blue-600 italic">Best AI Software</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-sm sm:text-base font-medium">
            Discover, compare, and explore {globalTotalCount > 0 ? `${globalTotalCount}+` : "verified"} production AI tools, developer utilities, and SaaS platforms.
          </p>

          {/* 🔍 SEARCH BAR */}
          <div className="max-w-2xl mx-auto relative shadow-xl shadow-slate-200/50 rounded-2xl">
            <input
              type="text"
              placeholder={globalTotalCount > 0 ? `Search ${globalTotalCount}+ AI tools by name, category, or workflow...` : "Search AI tools by name, category, or workflow..."}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-16 pl-6 pr-16 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-600 transition"
            />
            <div className="absolute right-3 top-3 bottom-3 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
              🔍
            </div>
          </div>

          {/* 📁 CATEGORIES FILTER */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={c.name === "All" ? "/" : `/?cat=${encodeURIComponent(c.name)}`}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                  activeCat === c.name
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-400"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </header>

        {/* 🚀 DIRECTORY GRID */}
        <section className="max-w-7xl mx-auto px-6 pb-24 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              VERIFIED AI DIRECTORY ({globalTotalCount > 0 ? globalTotalCount : filteredTools.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-40 text-xs font-extrabold tracking-widest uppercase text-slate-400">
              Loading Verified AI Engines...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => {
                const cleanSlug = tool.slug
                  ? String(tool.slug).toLowerCase().trim()
                  : tool.name
                  ? String(tool.name).toLowerCase().trim()
                  : "";

                if (!cleanSlug) return null;

                return (
                  <Link
                    key={tool.id || cleanSlug}
                    href={`/tool/${cleanSlug}`}
                    className="group bg-white border border-slate-200/80 rounded-3xl p-6 hover:border-blue-600 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <ToolLogo tool={tool} size="md" />
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                          {tool.pricing || "Freemium"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-2 leading-relaxed">
                          {tool.description || "Verified AI software platform."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                        {tool.category || "General AI"}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 🌐 FOOTER */}
        <footer className="bg-white border-t border-slate-200/80 py-12 px-6 text-center space-y-6">
          <h2 className="text-3xl font-black tracking-tighter">
            AI Vault<span className="text-blue-600">.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
            <Link href="/about" className="hover:text-slate-900">About Us</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact Support</Link>
          </div>
          <p className="text-slate-400 text-xs font-medium">
            © {new Date().getFullYear()} AI Vault. All rights reserved.
          </p>
        </footer>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center font-bold text-xs uppercase tracking-widest text-slate-400">
          Loading AI Vault...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
