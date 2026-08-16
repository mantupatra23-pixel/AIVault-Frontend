// app/contact/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to dispatch message.");
      }

      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error dispatching inquiry";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="AI Vault" className="h-8 w-8 object-contain" />
            <span className="text-lg font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            ← Back to Directory
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ⚡ Direct Dispatch
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            Contact AI Vault Desk
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500">
            Have questions regarding tool listing reviews, sponsored spotlight slots, or editorial corrections?
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {sent ? (
            <div className="text-center py-10 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-950">Message Sent to Admin Desk</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your inquiry has been logged into our admin dashboard. Our editorial team will review and reply via email.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => setSent(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Send Another Message
                </button>
                <Link
                  href="/"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black transition"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-3 text-red-600 font-bold text-[11px]">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                  Inquiry Type
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Tool Verification & Claim">Tool Verification & Claim</option>
                  <option value="Featured Spotlight / Sponsorship">Featured Spotlight / Sponsorship</option>
                  <option value="Data Correction">Data Correction / Edit Listing</option>
                  <option value="Bug Report">Bug Report & Feedback</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide detailed information regarding your inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message ✉️"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
