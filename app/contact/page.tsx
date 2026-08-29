"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Tool Verification & Claim");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      setErrorMsg("Please fill out your Email and Message.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Founder",
          email: email.trim(),
          subject,
          issue_type: subject,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send message.");

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error sending message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            ← Back to Directory
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ⚡ Direct Dispatch
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Contact AI Vault Desk
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Have questions regarding tool listing reviews, sponsored spotlight slots, or editorial corrections?
          </p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center space-y-4 animate-in fade-in duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-black">
              ✓
            </div>
            <h2 className="text-xl font-black text-slate-950">Message Sent to Admin Desk</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your inquiry has been logged into our admin dashboard. Our editorial team will review and reply via email.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Send Another Message
              </button>
              <Link
                href="/"
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700"
              >
                Back to Directory →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4 text-xs">
            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 font-bold">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject / Inquiry Type</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="Tool Verification & Claim">Tool Verification & Claim</option>
                <option value="Sponsored Spotlight Inquiry">Sponsored Spotlight Inquiry ($29 / $49)</option>
                <option value="Payment Assistance / Custom Invoice">Payment Assistance / Custom Invoice</option>
                <option value="Editorial Correction / Update">Editorial Correction / Update</option>
                <option value="Partnership & Integration">Partnership & Integration</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Message Content *</label>
              <textarea
                rows={5}
                required
                placeholder="Provide details regarding your tool, transaction, or inquiry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-700 shadow-md transition disabled:opacity-50"
            >
              {loading ? "Sending Message..." : "Dispatch Message to Admin 🚀"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
