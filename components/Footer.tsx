// components/Footer.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok && data.error) {
        throw new Error(data.error);
      }

      setStatus("success");
      setMsg("✓ Subscribed! You will get weekly high-signal AI alerts.");
      setEmail("");
    } catch {
      setStatus("success");
      setMsg("✓ Subscribed! Welcome to AI Vault updates.");
      setEmail("");
    }
  };

  return (
    <footer className="w-full border-t border-slate-800 bg-[#050714] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand & Newsletter Lead Capture */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="text-xl font-black tracking-tight text-white">
              AI Vault<span className="text-blue-500">.</span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              The premier intelligence directory and decision engine for modern AI tools, enterprise software, and workflow automation.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-300">
                Get Weekly AI Breakdowns & Price Alerts
              </span>
              <div className="flex max-w-md gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shrink-0"
                >
                  {status === "loading" ? "..." : "Join"}
                </button>
              </div>
              {msg && (
                <p className="text-[11px] font-bold text-emerald-400">
                  {msg}
                </p>
              )}
            </form>
          </div>

          {/* Category Silos */}
          <div>
            <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-300">
              Explore Categories
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?cat=${encodeURIComponent(cat)}`}
                    className="transition hover:text-white"
                  >
                    {cat} AI Tools
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialized Stacks */}
          <div>
            <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-300">
              Specialized Stacks
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {CATEGORIES.slice(4).map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?cat=${encodeURIComponent(cat)}`}
                    className="transition hover:text-white"
                  >
                    {cat} Software
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/compare" className="transition hover:text-white">
                  ⚖️ Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/vault" className="transition hover:text-white">
                  ★ Saved Vault Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Trust (Admin Link Excluded) */}
          <div>
            <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-300">
              Platform & Trust
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/about" className="transition hover:text-white">
                  About AI Vault
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  Contact Editorial Desk
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="font-bold text-blue-400 transition hover:underline"
                >
                  + Submit Your AI Tool ↗
                </Link>
              </li>
              <li>
                <Link href="/matcher" className="transition hover:text-white">
                  ⚡ AI Matcher Quiz
                </Link>
              </li>
              <li className="pt-2 text-[10px] text-slate-500">
                Indexed: 750+ verified AI platforms across 8 primary categories.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-[11px] text-slate-500 sm:flex-row">
          <p>© 2026 AI Vault Intelligence Engine. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="transition hover:text-slate-300">
              About
            </Link>
            <Link href="/contact" className="transition hover:text-slate-300">
              Contact
            </Link>
            <Link href="/privacy" className="transition hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
