// components/Footer.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "Productivity",
  "Marketing",
  "Coding",
  "Chatbot",
  "Image",
  "Writing",
  "Audio",
  "Video",
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    try {
      setStatus("loading");
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "global_footer" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Subscription failed");

      setStatus("success");
      setMsg("✓ Subscribed! You will get weekly high-ROI AI updates.");
      setEmail("");
    } catch (err: unknown) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Error subscribing.");
    }
  };

  return (
    <footer className="border-t border-slate-800 bg-[#070913] text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand & Newsletter Lead Capture */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="text-xl font-black tracking-tight text-white">
              AI Vault<span className="text-blue-500">.</span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              The premier intelligence directory and decision engine for modern AI tools, enterprise software, and workflow automation.
            </p>

            <form onSubmit={handleSubscribe} className="max-w-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Get Weekly AI Breakdowns & Price Alerts
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-600/20"
                >
                  {status === "loading" ? "..." : "Join"}
                </button>
              </div>
              {msg && (
                <p className={`text-[11px] font-bold ${status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                  {msg}
                </p>
              )}
            </form>
          </div>

          {/* Category Silos */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-white mb-3">
              Explore Categories
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <li key={cat}>
                  <Link href={`/?cat=${encodeURIComponent(cat)}`} className="hover:text-white transition">
                    {cat} AI Tools
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialized Stacks */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-white mb-3">
              Specialized Stacks
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(4).map((cat) => (
                <li key={cat}>
                  <Link href={`/?cat=${encodeURIComponent(cat)}`} className="hover:text-white transition">
                    {cat} Software
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/compare" className="hover:text-white transition">
                  ⚖️ Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/vault" className="hover:text-white transition">
                  ★ Saved Vault Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Builders & Platform */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-white mb-3">
              For Founders
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  + Submit Your AI Tool ↗
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition">
                  Admin Console
                </Link>
              </li>
              <li className="pt-2 text-[10px] text-slate-500">
                Indexed: 750+ verified AI platforms across 8 primary categories.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 sm:flex-row text-[11px] text-slate-500">
          <p>© 2026 AI Vault Intelligence Engine. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/" className="hover:text-slate-300">Terms of Service</Link>
            <Link href="/submit" className="hover:text-slate-300">Advertise / Sponsor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
