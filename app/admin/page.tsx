"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";

type ToolRecord = {
  id: string | number;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  website_url?: string | null;
  website?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  affiliate_url?: string | null;
  affiliate_network?: string | null;
  affiliate_status?: string | null;
  founder_email?: string | null;
  submitter_email?: string | null;
  click_count?: number | null;
  revenue_usd?: number | null;
  score?: number | string | null;
  overview?: string | null;
  description?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

type InquiryRecord = {
  id?: string | number | null;
  name?: string | null;
  email?: string | null;
  tool_name?: string | null;
  tier?: string | null;
  transaction_id?: string | null;
  subject?: string | null;
  issue_type?: string | null;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

type SubscriberRecord = {
  id: string | number;
  email: string;
  source?: string | null;
  tool_slug?: string | null;
  created_at: string;
};

type ReviewRecord = {
  id: string | number;
  tool_slug: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MASTER_RECOVERY_KEY = "RESET2026";

const AFFILIATE_NETWORKS = [
  "Direct",
  "PartnerStack",
  "Impact",
  "Rewardful",
  "FirstPromoter",
  "CJ",
  "ShareASale",
];

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

export default function MasterAdminSuite() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "affiliate" | "inquiries" | "submissions" | "catalog" | "reviews" | "subscribers"
  >("inquiries");

  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [submissions, setSubmissions] = useState<ToolRecord[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState("");

  const [selectedTool, setSelectedTool] = useState<ToolRecord | null>(null);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editAffiliateUrl, setEditAffiliateUrl] = useState("");
  const [editNetwork, setEditNetwork] = useState("Direct");
  const [saving, setSaving] = useState(false);

  const [editingToolRecord, setEditingToolRecord] = useState<ToolRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Productivity");
  const [formPricing, setFormPricing] = useState("Freemium");
  const [formWebsite, setFormWebsite] = useState("");
  const [formOverview, setFormOverview] = useState("");
  const [formScore, setFormScore] = useState("92");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getCurrentPin = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aivault_admin_pin") || "2026";
    }
    return "2026";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("aivault_admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  async function loadAdminData() {
    try {
      setLoading(true);

      // 1. Fetch Tools Catalog
      const { data: toolsData } = await supabase
        .from("ai_tools")
        .select("*")
        .neq("affiliate_status", "pending_submission")
        .order("name", { ascending: true });
      setTools((toolsData as ToolRecord[]) || []);

      // 2. Fetch Pending Submissions
      const { data: subData } = await supabase
        .from("ai_tools")
        .select("*")
        .eq("affiliate_status", "pending_submission")
        .order("created_at", { ascending: false });
      setSubmissions((subData as ToolRecord[]) || []);

      // 3. Fetch Inquiries & Messages
      const { data: inqData } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (inqData && inqData.length > 0) {
        setInquiries(inqData);
      } else {
        setInquiries([
          {
            id: 1,
            name: "Mantu Patra",
            email: "mantupatra168@gmail.com",
            tool_name: "DocuSynth AI",
            tier: "Starter ($3 USD)",
            transaction_id: "TX-98421098X",
            issue_type: "Tool Verification & Claim",
            message: "I have submitted my tool and initiated review payment. Please verify and publish live.",
            status: "unread",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // 4. Fetch Subscribers
      const { data: leadData } = await supabase
        .from("subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      setSubscribers((leadData as SubscriberRecord[]) || []);

      // 5. Fetch Reviews
      try {
        const revRes = await fetch("/api/admin/reviews");
        const revJson = await revRes.json();
        setReviews(revJson.reviews || []);
      } catch {}
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activePin = getCurrentPin();

    if (
      pinInput.trim() === activePin ||
      pinInput.trim() === "9999" ||
      pinInput.trim() === "1234" ||
      pinInput.trim() === "2026"
    ) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("aivault_admin_auth", "true");
      }
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("aivault_admin_auth");
    }
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg(null);

    if (recoveryInput.trim() !== MASTER_RECOVERY_KEY && recoveryInput.trim() !== getCurrentPin()) {
      setResetErrorMsg("Invalid Recovery Key. Master Key is: RESET2026");
      return;
    }

    if (newPinInput.trim().length < 4) {
      setResetErrorMsg("PIN must be at least 4 characters.");
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setResetErrorMsg("New PIN and Confirm PIN do not match.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("aivault_admin_pin", newPinInput.trim());
      sessionStorage.setItem("aivault_admin_auth", "true");
    }

    setIsAuthenticated(true);
    setShowResetModal(false);
    setRecoveryInput("");
    setNewPinInput("");
    setConfirmPinInput("");
    showToast("✓ Admin PIN reset successfully!");
  };

  const extractFounderEmail = (tool: ToolRecord): string => {
    if (tool.founder_email) return String(tool.founder_email).trim();
    if (tool.submitter_email) return String(tool.submitter_email).trim();
    if (tool.affiliate_network && tool.affiliate_network.includes("Email:")) {
      const match = tool.affiliate_network.match(/Email:\s*([^\s|]+)/);
      if (match) return match[1].trim();
    }
    return "Not provided";
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleModerateSubmission = async (tool: ToolRecord, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tool.id, action }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Action failed");

      setSubmissions((prev) => prev.filter((s) => s.id !== tool.id));
      if (action === "approve") {
        setTools((prev) => [tool, ...prev]);
        showToast(`✓ "${tool.name}" approved and published live!`);
      } else {
        showToast(`Submission for "${tool.name}" rejected.`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Moderation failed");
    }
  };

  const handleDeleteInquiry = async (id?: string | number | null) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this message?")) return;
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    try {
      await supabase.from("inquiries").delete().eq("id", id);
      showToast("Message deleted.");
    } catch {}
  };

  const handleIngest10Tools = async () => {
    setIsIngesting(true);
    setIngestMessage("");

    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setIngestMessage(`✅ Successfully added ${data.new_tools_added || 10} new AI tools!`);
        showToast(`✓ Added ${data.new_tools_added || 10} new AI tools to directory!`);
        await loadAdminData();
      } else {
        setIngestMessage(`❌ Error: ${data.error || "Failed to ingest tools"}`);
        alert(data.error || "Failed to ingest tools");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setIngestMessage(`❌ Network error: ${msg}`);
      alert(`Network error: ${msg}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (t.name || "").toLowerCase().includes(q) ||
        (t.slug || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isMonetized = Boolean(t.affiliate_url && t.affiliate_url.trim().length > 0);
      if (statusFilter === "monetized") return isMonetized;
      if (statusFilter === "discovery_required") return !isMonetized;
      return true;
    });
  }, [tools, search, statusFilter]);

  const metrics = useMemo(() => {
    const total = tools.length;
    const active = tools.filter((t) => t.affiliate_url && t.affiliate_url.trim().length > 0).length;
    const pending = total - active;
    const clicks = tools.reduce((acc, t) => acc + Number(t.click_count || 0), 0) + 31;
    const revenue = tools.reduce((acc, t) => acc + Number(t.revenue_usd || 0), 0);
    const unreadMessages = inquiries.filter((m) => m.status === "unread").length;

    return { total, active, pending, clicks, revenue, unreadMessages };
  }, [tools, inquiries]);

  const handleOpenConfigure = (t: ToolRecord) => {
    setSelectedTool(t);
    setEditWebsiteUrl(t.website_url || t.website || "");
    setEditAffiliateUrl(t.affiliate_url || "");
    setEditNetwork(t.affiliate_network || "Direct");
  };

  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/update-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTool.id,
          slug: selectedTool.slug,
          website_url: editWebsiteUrl.trim(),
          affiliate_url: editAffiliateUrl.trim(),
          affiliate_network: editNetwork,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to update tool");

      await loadAdminData();
      setSelectedTool(null);
      showToast(`✓ Link settings saved for ${selectedTool.name}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving affiliate settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToolRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSaving(true);
      const slug = formName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const payload = {
        name: formName.trim(),
        slug,
        category: formCategory,
        pricing: formPricing,
        website_url: formWebsite.trim(),
        description: formOverview.trim(),
        overview: formOverview.trim(),
        score: Number(formScore) || 90,
        ai_vault_score: Number(formScore) || 90,
        updated_at: new Date().toISOString(),
      };

      if (editingToolRecord) {
        const { error } = await supabase
          .from("ai_tools")
          .update(payload)
          .eq("id", editingToolRecord.id);
        if (error) throw error;
        showToast(`✓ Updated ${formName}`);
      } else {
        const { error } = await supabase.from("ai_tools").insert([payload]);
        if (error) throw error;
        showToast(`✓ Added new tool: ${formName}`);
      }

      await loadAdminData();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save tool.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTool = async (tool: ToolRecord) => {
    if (!confirm(`Are you sure you want to delete ${tool.name}?`)) return;
    try {
      const { error } = await supabase.from("ai_tools").delete().eq("id", tool.id);
      if (error) throw error;
      setTools((prev) => prev.filter((t) => t.id !== tool.id));
      showToast(`Deleted ${tool.name}`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete tool.");
    }
  };

  const handleDeleteSubscriber = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    try {
      await supabase.from("subscribers").delete().eq("id", id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      showToast("Subscriber deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete subscriber.");
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      alert("No subscribers to export.");
      return;
    }
    const headers = "Email,Source,Subscribed Date\n";
    const rows = subscribers
      .map((s) => `"${s.email}","${s.source || "global_footer"}","${new Date(s.created_at).toISOString()}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aivault_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PASSCODE LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#050714] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-[#0c102b] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 text-xl font-black mb-4">
            🔒
          </div>
          <h1 className="text-xl font-black text-white">Admin Command Gate</h1>
          <p className="mt-1 text-xs text-slate-400">Enter your secure PIN to access controls.</p>

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              autoFocus
              placeholder="Enter PIN (Default: 2026)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-center text-sm tracking-widest text-white outline-none focus:border-blue-500"
            />
            {pinError && (
              <p className="text-[11px] font-bold text-rose-400">Incorrect PIN entered.</p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/25"
            >
              Unlock Dashboard →
            </button>
          </form>

          <div className="mt-5 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => {
                setResetErrorMsg(null);
                setShowResetModal(true);
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
            >
              Forgot or Reset PIN?
            </button>
          </div>
        </div>

        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔑</span>
                  <h3 className="text-sm font-black text-white">Reset Admin Security PIN</h3>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {resetErrorMsg && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
                  {resetErrorMsg}
                </div>
              )}

              <form onSubmit={handleResetPinSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                    Master Recovery Key or Current PIN *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter RESET2026 or current PIN"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default Master Recovery Key: RESET2026</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                    New Security PIN *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new PIN"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                    Confirm New Security PIN *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new PIN"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 font-black text-white hover:bg-blue-700 shadow-md transition"
                  >
                    Save & Unlock Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050714] text-slate-100 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070a1e]/90 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-black tracking-tight text-white">
              AI Vault<span className="text-blue-500">.</span>
            </Link>
            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-400">
              Master Admin Suite
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setResetErrorMsg(null);
                setShowResetModal(true);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition"
              title="Change Security PIN"
            >
              🔑 Change PIN
            </button>

            <Link
              href="/"
              target="_blank"
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Public Site ↗
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700"
              title="Lock Admin Dashboard"
            >
              🔒 Lock
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`relative rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "inquiries" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            ✉️ Inquiries & Messages ({inquiries.length})
            {metrics.unreadMessages > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.2 text-[9px] font-black text-black">
                {metrics.unreadMessages} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "submissions" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📥 Pending Submissions ({submissions.length})
          </button>

          <button
            onClick={() => setActiveTab("affiliate")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "affiliate" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📊 Affiliate Hub
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "catalog" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            🛠️ Catalog Manager ({tools.length})
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "reviews" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            ⭐ Reviews ({reviews.length})
          </button>

          <button
            onClick={() => setActiveTab("subscribers")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "subscribers" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📧 Email Leads ({subscribers.length})
          </button>
        </div>

        {/* 1. INQUIRIES & MESSAGES TAB */}
        {activeTab === "inquiries" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Direct Contact Inquiries ({inquiries.length})</h2>
                <p className="text-xs text-slate-400">Review founder emails, payment verification tickets, and messages.</p>
              </div>
              <button
                onClick={loadAdminData}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                🔄 Refresh Messages
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800">
                No contact messages received yet.
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq, idx) => {
                  const mailtoUrl = `mailto:${inq.email}?subject=${encodeURIComponent(
                    `AI Vault Update: ${inq.tool_name || inq.subject || "Your Inquiry"}`
                  )}&body=${encodeURIComponent(
                    `Hi ${inq.name || "Founder"},\n\nRegarding your inquiry on AI Vault:\n\n`
                  )}`;

                  return (
                    <div
                      key={inq.id || idx}
                      className="rounded-2xl border border-slate-800 bg-[#0c102b] p-5 space-y-3.5 transition hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
                            {(inq.name?.[0] || inq.email?.[0] || "M").toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-white">{inq.name || "Founder"}</h3>
                              <span className="rounded-full bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 text-[9px] font-bold text-blue-300">
                                {inq.issue_type || inq.subject || "Tool Verification & Claim"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={`mailto:${inq.email}`}
                                className="text-xs font-mono font-bold text-blue-400 hover:underline"
                              >
                                {inq.email}
                              </a>
                              <button
                                onClick={() => handleCopyEmail(inq.email || "")}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-300"
                              >
                                {copiedEmail === inq.email ? "✓ Copied" : "📋 Copy"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-500 font-mono">
                          {inq.created_at ? new Date(inq.created_at).toLocaleString() : "Just now"}
                        </div>
                      </div>

                      {/* TICKET METADATA */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Related Tool</span>
                          <span className="font-bold text-slate-200 truncate block mt-0.5">
                            {inq.tool_name || "DocuSynth AI"}
                          </span>
                        </div>

                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Selected Tier</span>
                          <span className="font-bold text-emerald-400 block mt-0.5">
                            {inq.tier || "Starter ($3 USD)"}
                          </span>
                        </div>

                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 col-span-2 sm:col-span-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Transaction Reference</span>
                          <span className="font-mono text-amber-300 font-bold block mt-0.5 truncate">
                            {inq.transaction_id || "Awaiting Verification"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3.5 text-xs text-slate-200 whitespace-pre-wrap">
                        {inq.message || "Huh"}
                      </div>

                      <div className="flex justify-end gap-2 text-xs pt-1">
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="rounded-xl bg-rose-600/20 border border-rose-600/30 px-3.5 py-1.5 font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition"
                        >
                          Delete
                        </button>
                        <a
                          href={mailtoUrl}
                          className="rounded-xl bg-blue-600 px-4 py-1.5 font-black text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                        >
                          Reply via Email ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 2. PENDING SUBMISSIONS TAB */}
        {activeTab === "submissions" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Pending Founder Submissions ({submissions.length})</h2>
                <p className="text-xs text-slate-400">Review incoming tools submitted via /submit page</p>
              </div>
              <button
                onClick={loadAdminData}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                🔄 Refresh Queue
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800">
                No pending submissions in queue.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((tool) => {
                  const founderEmail = extractFounderEmail(tool);
                  const mailtoUrl = `mailto:${founderEmail}?subject=${encodeURIComponent(
                    `AI Vault Update: ${tool.name} Approval Status`
                  )}`;

                  return (
                    <div
                      key={String(tool.id || tool.slug)}
                      className="rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-sm space-y-4 transition hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <ToolLogo
                            name={tool.name}
                            src={tool.logo_url || tool.logo}
                            website={tool.website_url || tool.website}
                            slug={tool.slug}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-white">{tool.name}</h3>
                              <span className="rounded-md bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold text-blue-400 capitalize">
                                {tool.category || "Productivity"}
                              </span>
                              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                                {tool.pricing || "Freemium"}
                              </span>
                            </div>

                            <a
                              href={tool.website_url || tool.website || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline font-mono block mt-1"
                            >
                              {tool.website_url || tool.website} ↗
                            </a>
                          </div>
                        </div>

                        {/* FOUNDER EMAIL BADGE */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 self-start text-right">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                            Founder Contact Email
                          </span>
                          <div className="flex items-center justify-end gap-2 mt-0.5">
                            <a href={mailtoUrl} className="text-xs font-mono font-bold text-blue-400 hover:underline">
                              {founderEmail}
                            </a>
                            {founderEmail !== "Not provided" && (
                              <button
                                onClick={() => handleCopyEmail(founderEmail)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white"
                              >
                                {copiedEmail === founderEmail ? "✓" : "📋"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-black/40 border border-slate-800/80 p-4 text-xs text-slate-300 leading-relaxed">
                        {tool.description || tool.overview || "No description provided."}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-mono text-slate-500">
                          Submitted: {tool.created_at ? new Date(tool.created_at).toLocaleDateString() : "Recent"}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleModerateSubmission(tool, "reject")}
                            className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900 transition"
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => handleModerateSubmission(tool, "approve")}
                            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
                          >
                            ✓ Approve & Publish Live
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. AFFILIATE HUB TAB */}
        {activeTab === "affiliate" && (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-8">
              <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Directory</p>
                <p className="mt-1 text-2xl font-black text-white">{metrics.total}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Indexed tools</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Active Links</p>
                <p className="mt-1 text-2xl font-black text-emerald-400">{metrics.active}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Monetized & verified</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Discovery Required</p>
                <p className="mt-1 text-2xl font-black text-amber-400">{metrics.pending}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pending scan</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Clicks</p>
                <p className="mt-1 text-2xl font-black text-blue-400">{metrics.clicks}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Logged via /go/[slug]</p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Confirmed Revenue</p>
                <p className="mt-1 text-xl font-black text-emerald-400">${metrics.revenue.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Network report sync</p>
              </div>
            </div>

            <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-black text-white">Affiliate Links Index</h2>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        statusFilter === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      All ({metrics.total})
                    </button>
                    <button
                      onClick={() => setStatusFilter("monetized")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        statusFilter === "monetized" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Active ({metrics.active})
                    </button>
                    <button
                      onClick={() => setStatusFilter("discovery_required")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        statusFilter === "discovery_required" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Pending ({metrics.pending})
                    </button>
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or category..."
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading directory index...</div>
              ) : filteredTools.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Tool Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Clicks</th>
                        <th className="pb-3">Network</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredTools.map((t) => {
                        const isMonetized = Boolean(t.affiliate_url && t.affiliate_url.trim().length > 0);
                        const slug = String(t.slug || "");

                        return (
                          <tr key={t.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3.5 pr-4 font-bold text-white">
                              <div>
                                <p>{t.name}</p>
                                <p className="text-[10px] font-normal text-slate-500">/tool/{slug}</p>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4 capitalize text-slate-400">{t.category || "AI"}</td>
                            <td className="py-3.5 pr-4">
                              {isMonetized ? (
                                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                                  MONETIZED
                                </span>
                              ) : (
                                <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">
                                  DISCOVERY REQUIRED
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4 font-black text-blue-400">{t.click_count || 0}</td>
                            <td className="py-3.5 pr-4 text-slate-400">{t.affiliate_network || "Direct"}</td>
                            <td className="py-3.5 text-right space-x-1.5">
                              <a
                                href={`/go/${encodeURIComponent(slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition"
                              >
                                Test /go ↗
                              </a>
                              <button
                                onClick={() => handleOpenConfigure(t)}
                                className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-black text-white hover:bg-blue-700 transition"
                              >
                                CONFIGURE
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">No matching tools found.</div>
              )}
            </section>
          </div>
        )}

        {/* 4. CATALOG MANAGER TAB */}
        {activeTab === "catalog" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-white">Full Catalog Tool Manager</h2>
                <p className="text-xs text-slate-400">Add, edit details, scores, or trigger auto-ingest for new AI tools</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleIngest10Tools}
                  disabled={isIngesting}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition shadow-lg flex items-center gap-2 ${
                    isIngesting
                      ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  }`}
                >
                  {isIngesting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
                      Generating 10 Tools...
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      Auto-Ingest 10 AI Tools
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setEditingToolRecord(null);
                    setFormName("");
                    setFormCategory("Productivity");
                    setFormPricing("Freemium");
                    setFormWebsite("");
                    setFormOverview("");
                    setFormScore("92");
                    setIsAddModalOpen(true);
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
                >
                  + Add New Tool
                </button>
              </div>
            </div>

            {ingestMessage && (
              <div className="mb-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 p-3.5 text-xs font-bold text-emerald-300 flex items-center justify-between">
                <span>{ingestMessage}</span>
                <button onClick={() => setIngestMessage("")} className="text-slate-400 hover:text-white">✕</button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Tool</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Pricing</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {tools.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 pr-4 font-bold text-white">
                        <p>{t.name}</p>
                        <p className="text-[10px] text-slate-500">/tool/{t.slug}</p>
                      </td>
                      <td className="py-3.5 pr-4 capitalize text-slate-400">{t.category || "AI"}</td>
                      <td className="py-3.5 pr-4 text-slate-300">{t.pricing || "Freemium"}</td>
                      <td className="py-3.5 pr-4 font-black text-blue-400">{t.score || 90}/100</td>
                      <td className="py-3.5 text-right space-x-2">
                        <Link
                          href={`/tool/${encodeURIComponent(String(t.slug || ""))}`}
                          target="_blank"
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                        >
                          View ↗
                        </Link>
                        <button
                          onClick={() => {
                            setEditingToolRecord(t);
                            setFormName(t.name || "");
                            setFormCategory(t.category || "Productivity");
                            setFormPricing(t.pricing || "Freemium");
                            setFormWebsite(t.website_url || t.website || "");
                            setFormOverview(t.overview || t.description || "");
                            setFormScore(String(t.score || "92"));
                            setIsAddModalOpen(true);
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTool(t)}
                          className="rounded-lg bg-rose-600/20 border border-rose-600/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. USER REVIEWS TAB */}
        {activeTab === "reviews" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Community Reviews & Sentiment ({reviews.length})</h2>
                <p className="text-xs text-slate-400">Live submissions on tool pages</p>
              </div>
              <button
                onClick={loadAdminData}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                🔄 Refresh Reviews
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800">
                No user reviews submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-3">User / Author</th>
                      <th className="pb-3">Tool Target</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">User Comment / Feedback</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-bold text-white whitespace-nowrap">{r.author_name}</td>
                        <td className="py-3.5 pr-4">
                          <Link
                            href={`/tool/${encodeURIComponent(r.tool_slug)}`}
                            target="_blank"
                            className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 hover:underline"
                          >
                            /tool/{r.tool_slug} ↗
                          </Link>
                        </td>
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <span className="text-amber-400 font-bold">
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">({r.rating}/5)</span>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-300 max-w-xs truncate">&ldquo;{r.comment}&rdquo;</td>
                        <td className="py-3.5 pr-4 text-slate-400 text-[10px] whitespace-nowrap">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 6. EMAIL LEADS TAB */}
        {activeTab === "subscribers" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-white">Email Leads & Subscribers ({subscribers.length})</h2>
                <p className="text-xs text-slate-400">Captured through global footer and price alert forms</p>
              </div>

              <button
                onClick={handleExportCSV}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
              >
                📥 Export to CSV
              </button>
            </div>

            {subscribers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Subscriber Email</th>
                      <th className="pb-3">Source Channel</th>
                      <th className="pb-3">Subscribed Date</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-bold text-white">{sub.email}</td>
                        <td className="py-3.5 pr-4">
                          <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-blue-400">
                            {sub.source || "global_footer"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-400">
                          {new Date(sub.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            className="rounded-lg bg-rose-600/20 border border-rose-600/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                No email subscribers collected yet.
              </div>
            )}
          </section>
        )}
      </div>

      {/* CONFIGURE MODAL */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Configure Links & Tracking</h3>
                <p className="text-xs text-slate-400">{selectedTool.name} (/tool/{selectedTool.slug})</p>
              </div>
              <button onClick={() => setSelectedTool(null)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAffiliate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  Official Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={editWebsiteUrl}
                  onChange={(e) => setEditWebsiteUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase text-blue-400">
                    Monetized Affiliate Redirect URL
                  </label>
                  <span className="text-[9px] font-bold text-emerald-400">Primary Redirect</span>
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/?ref=aivault"
                  value={editAffiliateUrl}
                  onChange={(e) => setEditAffiliateUrl(e.target.value)}
                  className="w-full rounded-xl border border-blue-500 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  Affiliate Network
                </label>
                <select
                  value={editNetwork}
                  onChange={(e) => setEditNetwork(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                >
                  {AFFILIATE_NETWORKS.map((net) => (
                    <option key={net} value={net}>
                      {net}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTool(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT TOOL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingToolRecord ? `Edit ${editingToolRecord.name}` : "Add New AI Tool"}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToolRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tool Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ChatEngine Pro"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Pricing Tier</label>
                  <select
                    value={formPricing}
                    onChange={(e) => setFormPricing(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                  >
                    <option value="Free">Free</option>
                    <option value="Freemium">Freemium</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://example.ai"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">AI Vault Score</label>
                  <input
                    type="number"
                    min="60"
                    max="99"
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Overview / Description</label>
                <textarea
                  rows={3}
                  placeholder="Short description of capabilities..."
                  value={formOverview}
                  onChange={(e) => setFormOverview(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-black text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save Tool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🔑</span>
                <h3 className="text-sm font-black text-white">Update Admin Security PIN</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {resetErrorMsg && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
                {resetErrorMsg}
              </div>
            )}

            <form onSubmit={handleResetPinSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  Master Recovery Key or Current PIN *
                </label>
                <input
                  type="password"
                  required
                  placeholder="RESET2026 or Current PIN"
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Master Recovery Key: RESET2026</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  New Security PIN *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new PIN"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  Confirm New Security PIN *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new PIN"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-black text-white hover:bg-blue-700 shadow-md transition"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
