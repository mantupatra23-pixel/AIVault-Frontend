"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import ToolLogo from "@/components/ToolLogo";

const CATEGORIES = [
  "Productivity",
  "Coding",
  "Chatbot",
  "Marketing",
  "Image",
  "Writing",
  "Audio",
  "Video",
];

const PRICING_MODELS = [
  "Freemium",
  "Free",
  "Free Trial",
  "Paid",
  "Enterprise",
];

const PAYPAL_HANDLE = "MANTUPATRA372";
const PAYPAL_EMAIL = "pmantu808@gmail.com";

const TIERS = [
  {
    id: "standard",
    name: "Starter Review",
    price: "$3",
    amount: 3,
    badge: "Basic",
    turnaround: "48-Hour Review",
    perks: [
      "Standard Directory Indexation",
      "Permanent SEO Dossier & Backlink",
      "Comparison Matrix Inclusion",
    ],
  },
  {
    id: "featured",
    name: "Featured Boost",
    price: "$19",
    amount: 19,
    badge: "Popular 🔥",
    turnaround: "24-Hour Express Publish",
    perks: [
      "Guaranteed 24-Hour Express Review",
      "Homepage Top Featured Spotlight (30 Days)",
      "Verified Blue Partner Glow Badge",
      "Priority Placement in AI Matcher Quiz",
    ],
  },
  {
    id: "spotlight",
    name: "Category Takeover",
    price: "$49",
    amount: 49,
    badge: "Maximum ROI",
    turnaround: "Instant 12h Priority",
    perks: [
      "All Featured Boost Benefits",
      "#1 Sticky Podium in Primary Category Hub",
      "Dofollow Editorial SEO Anchor Link",
      "Email Blast Feature to Active Subscribers",
    ],
  },
];

export default function SubmitToolPage() {
  const [selectedTier, setSelectedTier] = useState<"standard" | "featured" | "spotlight">("standard");

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [pricing, setPricing] = useState("Freemium");
  const [founderEmail, setFounderEmail] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "payment_ready" | "error">("idle");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const [supportTxId, setSupportTxId] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState<"idle" | "loading" | "sent">("idle");

  const activeTierObj = useMemo(() => {
    return TIERS.find((t) => t.id === selectedTier) || TIERS[0];
  }, [selectedTier]);

  const paypalMerchantCheckoutUrl = useMemo(() => {
    const itemName = encodeURIComponent(`AI Vault - ${activeTierObj.name} (${name || "Tool"})`);
    return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
      PAYPAL_EMAIL
    )}&item_name=${itemName}&amount=${activeTierObj.amount}&currency_code=USD`;
  }, [activeTierObj, name]);

  const paypalMeUrl = useMemo(() => {
    return `https://www.paypal.com/paypalme/${PAYPAL_HANDLE}/${activeTierObj.amount}USD`;
  }, [activeTierObj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !website.trim() || !description.trim()) {
      setStatus("error");
      setFeedbackMsg("Please fill out all required fields marked with *.");
      return;
    }

    if (!founderEmail.trim() || !founderEmail.includes("@")) {
      setStatus("error");
      setFeedbackMsg("A valid Founder / Contact Email is compulsory.");
      return;
    }

    try {
      setStatus("loading");
      setFeedbackMsg("");

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website_url: website.trim(),
          logo_url: logoUrl.trim() || null,
          category,
          pricing,
          founder_email: founderEmail.trim(),
          description: description.trim(),
          overview: description.trim(),
          tier: selectedTier,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Submission failed. Please check inputs.");
      }

      setStatus("payment_ready");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setStatus("error");
      setFeedbackMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderEmail.trim()) return;

    try {
      setSupportStatus("loading");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Founder",
          email: founderEmail.trim(),
          tool_name: name.trim(),
          tier: activeTierObj.name,
          transaction_id: supportTxId.trim(),
          subject: "Payment Assistance / Direct Invoice Request",
          message: supportMessage.trim() || "Need alternative payment assistance or direct invoice.",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Support submission failed.");
      setSupportStatus("sent");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to register support request.");
      setSupportStatus("idle");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setName("");
    setWebsite("");
    setLogoUrl("");
    setDescription("");
    setFounderEmail("");
    setSelectedTier("standard");
    setSupportTxId("");
    setSupportMessage("");
    setSupportStatus("idle");
  };

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* TITLE */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 mb-3">
            <span>⚡ Founder Direct Placement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Submit & Boost Your AI Product
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Get discovered by 25,000+ monthly active founders, software engineers, and growth teams evaluating AI workflow automation.
          </p>
        </div>

        {status === "payment_ready" ? (
          /* STEP 2: PAYMENT OPTIONS CONTAINER */
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white p-6 sm:p-10 shadow-md text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-black shadow-lg shadow-blue-500/30">
                ✓
              </div>

              <div>
                <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-800">
                  Step 2: Complete Review Payment
                </span>
                <h2 className="text-2xl font-black text-slate-950 mt-2">
                  Metadata Recorded for {name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Your product is queued in our editorial review database. Choose your payment method below to initiate verification:
                </p>
              </div>

              {/* 3 PAYMENT OPTIONS BOX */}
              <div className="rounded-2xl border border-blue-200 bg-white p-5 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-900 uppercase">
                    Selected Tier: {activeTierObj.name}
                  </span>
                  <span className="rounded-full bg-emerald-600 text-white text-xs font-black px-3 py-1">
                    Amount: {activeTierObj.price} USD
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Option 1: Card / PayPal Merchant */}
                  <a
                    href={paypalMerchantCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-[#0070BA] hover:bg-[#003087] p-3.5 text-white shadow-md transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💳</span>
                      <div>
                        <p className="text-xs font-black">Option 1: Pay with Credit / Debit Card or PayPal</p>
                        <p className="text-[10px] text-blue-100">Instant Worldwide Card Checkout ({activeTierObj.price} USD)</p>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-lg group-hover:bg-white/30">
                      Pay Now ↗
                    </span>
                  </a>

                  {/* Option 2: PayPal.me Direct Link */}
                  <a
                    href={paypalMeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-3.5 text-slate-800 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🅿️</span>
                      <div>
                        <p className="text-xs font-black">Option 2: Direct PayPal.me Transfer</p>
                        <p className="text-[10px] text-slate-500">paypal.me/{PAYPAL_HANDLE}/{activeTierObj.amount}USD</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-600 group-hover:underline">
                      Open Link ↗
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* PAYMENT ASSISTANCE / SUPPORT TICKET CONTAINER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">💬</span>
                <h3 className="text-sm font-black text-slate-950">
                  Option 3: Need an Alternate Payment Method or Custom Invoice?
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                If your card was declined or you need manual verification, submit this ticket. It will directly notify our editorial desk:
              </p>

              {supportStatus === "sent" ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800">
                  ✓ Support ticket received! We will verify your submission and reply to <strong>{founderEmail}</strong> within 12 hours.
                </div>
              ) : (
                <form onSubmit={handleSupportTicket} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={founderEmail}
                        onChange={(e) => setFounderEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        PayPal Transaction ID (If already paid)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9X482014..."
                        value={supportTxId}
                        onChange={(e) => setSupportTxId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notes / Message to Editorial Team
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Paid via card / please send bank invoice / request fast review..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={supportStatus === "loading"}
                      className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
                    >
                      {supportStatus === "loading" ? "Submitting..." : "Send Ticket to Admin 📨"}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
                    >
                      Submit Another Product
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* STEP 1: FORM & TIER SELECTION */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: 3 TIERS + FORM (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 3 TIERS AT TOP */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  1. Select Placement Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TIERS.map((t) => {
                    const isSelected = selectedTier === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTier(t.id as "standard" | "featured" | "spotlight")}
                        className={`cursor-pointer rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? "border-2 border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm"
                            : "border border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {t.name}
                            </span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-800">
                              {t.badge}
                            </span>
                          </div>
                          <div className="text-2xl font-black text-slate-950 mt-1">
                            {t.price} <span className="text-[10px] font-bold text-slate-400">USD</span>
                          </div>
                          <p className="text-[10px] text-blue-600 font-bold mt-1">
                            {t.turnaround}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INPUT FORM CONTAINER */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-950">
                    2. Tool Metadata & Specifications
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400">Required fields marked with *</span>
                </div>

                {status === "error" && (
                  <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 leading-relaxed">
                    {feedbackMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Tool Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. DocuSynth AI"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Official Website URL <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://yourproduct.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Founder / Contact Email <span className="text-rose-500">* (Compulsory)</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="founder@company.com"
                      value={founderEmail}
                      onChange={(e) => setFounderEmail(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/20 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Primary Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Pricing Model <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={pricing}
                        onChange={(e) => setPricing(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                      >
                        {PRICING_MODELS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Logo Image URL (Optional — Auto-detected if empty)
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourproduct.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Product Description & Core Capabilities <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Explain the problem your tool solves, target audience, and workflow advantages..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-xl py-3.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition disabled:opacity-50 mt-2"
                  >
                    {status === "loading"
                      ? "Recording Metadata..."
                      : `Continue to Payment Options (${activeTierObj.price} USD) →`}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE CARD PREVIEW (5 COLS) */}
            <div className="lg:col-span-5 sticky top-20 space-y-6">
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  Live Catalog Card Preview
                </span>

                <div className="rounded-3xl border-2 border-dashed border-blue-300/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      Previewing #{name ? name : "Your Product"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                      ⚡ Verified
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5 mb-4">
                    <ToolLogo
                      name={name || "AI Product"}
                      src={logoUrl || null}
                      website={website || null}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-950 truncate">
                        {name || "Your AI Product Name"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 capitalize">
                          {category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {pricing}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {description || "Your tool description and capabilities will appear here live across search results, category pages, and comparison tables."}
                  </p>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-400 uppercase tracking-wider">AI Vault Score</span>
                      <span className="text-blue-600 font-black">{selectedTier === "spotlight" ? "98/100" : selectedTier === "featured" ? "95/100" : "91/100"}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                      <div className="h-full bg-blue-600 rounded-full w-[95%]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded-xl bg-blue-600 py-2 text-center text-xs font-black text-white shadow-sm opacity-90">
                        Visit Portal ↗
                      </span>
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                        Dossier →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER PERKS SUMMARY BOX */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                  Included in {activeTierObj.name} ({activeTierObj.price})
                </h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  {activeTierObj.perks.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
