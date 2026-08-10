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
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");

  const activeCat = searchParams.get("cat") || "All";

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        let query = supabase.from("ai_tools").select("*");
        if (activeCat !== "All") {
          query = query.ilike("category", `%${activeCat}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        setTools(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, [activeCat]);

  const filteredTools = tools.filter((t) => {
    const term = localSearch.toLowerCase();
    const nameMatch = t.name?.toLowerCase().includes(term);
    const descMatch = t.description?.toLowerCase().includes(term);
    const catMatch = t.category?.toLowerCase().includes(term);
    return nameMatch || descMatch || catMatch;
  });

  const categories = [
    { name: "All", icon: "⚡" },
    { name: "Chatbot", icon: "🤖" },
    { name: "Image Gen", icon: "🎨" },
    { name: "Video Gen", icon: "🎥" },
    { name: "Coding", icon: "💻" },
    { name: "Marketing", icon: "📈" },
    { name: "Productivity", icon: "🚀" },
  ];

  // Schema.org WebSite & Organization Structured Data
  const websiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "AI Vault",
        description: "Discover, compare and explore 740+ AI tools.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "AI Vault",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <main className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans">
        {/* 🧭 NAVIGATION */}
        <nav className="fixed top-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 flex items-center justify-between">
          <Link href="/" className="font-[1000] text-2xl tracking-tight text-slate-950 font-serif">
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.name}
                href={c.name === "All" ? "/" : `/?cat=${encodeURIComponent(c.name)}`}
                className={`hover:text-blue-600 transition-colors ${
                  activeCat === c.name ? "text-blue-600 font-extrabold" : ""
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-sm">
              740+ Engines
            </div>
          </div>
        </nav>

        {/* 🏆 HERO HEADER */}
        <header className="max-w-7xl mx-auto px-6 pt-32 pb-12 text-center space-y-6">
          <h1 className="text-5xl sm:text-7xl md:text-[90px] font-black tracking-tight text-slate-950 font-serif leading-none">
            Discover the World's <br />
            <span className="text-blue-600 italic">Best AI Tools</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-sm sm:text-base leading-relaxed font-medium">
            Discover, compare, and explore 740+ verified AI engines across Productivity, Coding, Image, and Video Generation.
          </p>

          {/* 🔍 SEARCH BAR */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search 740+ AI tools by name, features, or niche..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-16 pl-6 pr-16 bg-white border border-slate-200 rounded-full text-slate-900 placeholder:text-slate-400 font-medium shadow-sm focus:outline-none focus:border-blue-600 transition"
            />
            <div className="absolute right-3 top-3 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
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
                    ? "bg-slate-950 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </header>

        {/* 🚀 DIRECTORY GRID */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Verified AI Directory ({filteredTools.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-40 text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Loading Verified AI Engines...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => {
                // Ensure slug is clean and normalized
                const cleanSlug = tool.slug
                  ? String(tool.slug).toLowerCase().trim()
                  : tool.name
                  ? String(tool.name).toLowerCase().replace(/[\W_]+/g, "-").trim()
                  : "";

                if (!cleanSlug) return null;

                return (
                  <Link
                    key={tool.id || cleanSlug}
                    href={`/tool/${cleanSlug}`}
                    className="group bg-white border border-slate-200/80 hover:border-blue-300 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer active:scale-[0.98] select-none [touch-action:manipulation]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <ToolLogo tool={tool} size="lg" />

                        <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                          {tool.pricing || "Freemium"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors font-serif">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {tool.description || "Verified AI automation tool."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {tool.category || "General AI"}
                      </span>

                      {/* Span instead of nested Link to maintain valid HTML and seamless click handling */}
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        FULL REPORT →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 🌐 FOOTER */}
        <footer className="bg-white border-t border-slate-200 py-16 px-6 text-center space-y-8">
          <h2 className="text-3xl font-black tracking-tight font-serif text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </h2>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Link href="/privacy" className="hover:text-blue-600 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-blue-600 transition">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-blue-600 transition">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-blue-600 transition">
              Contact Support
            </Link>
          </div>

          <p className="text-slate-400 text-xs font-medium">
            © {new Date().getFullYear()} AI Vault. All rights reserved. Discover and compare top artificial intelligence software.
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
        <div className="h-screen w-full flex items-center justify-center text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Loading AI Vault...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
