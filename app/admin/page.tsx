// app/admin/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLogo from "@/components/ToolLogo";

type Tab =
  | "inquiries"
  | "submissions"
  | "affiliate"
  | "catalog"
  | "reviews"
  | "subscribers";

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
  submission_tier?: string | null;

  click_count?: number | null;
  revenue_usd?: number | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;

  overview?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  [key: string]: unknown;
};

type InquiryRecord = {
  id: string | number;
  name: string;
  email: string;
  tool_name?: string;
  tier?: string;
  transaction_id?: string;
  subject?: string;
  issue_type?: string;
  message: string;
  status?: string;
  created_at: string;
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

const PRICING_OPTIONS = ["Free", "Freemium", "Paid"];

/**
 * IMPORTANT:
 * Authentication must be performed by a server-side API.
 *
 * Expected endpoint:
 * POST /api/admin/auth
 * body: { pin: string }
 *
 * Expected successful response:
 * { success: true }
 *
 * The API should set an HttpOnly, Secure, SameSite cookie.
 *
 * DO NOT put the real admin PIN/recovery key in this file.
 */

async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export default function MasterAdminSuite() {
  /* ============================================================
     AUTH
  ============================================================ */

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  /* ============================================================
     DATA
  ============================================================ */

  const [activeTab, setActiveTab] = useState<Tab>("inquiries");

  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [submissions, setSubmissions] = useState<ToolRecord[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);

  const [loading, setLoading] = useState(true);

  /* ============================================================
     UI
  ============================================================ */

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "monetized" | "discovery_required"
  >("all");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  /* ============================================================
     INGEST
  ============================================================ */

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState("");

  /* ============================================================
     AFFILIATE CONFIG
  ============================================================ */

  const [selectedTool, setSelectedTool] = useState<ToolRecord | null>(null);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editAffiliateUrl, setEditAffiliateUrl] = useState("");
  const [editNetwork, setEditNetwork] = useState("Direct");

  /* ============================================================
     ADD / EDIT TOOL
  ============================================================ */

  const [editingToolRecord, setEditingToolRecord] =
    useState<ToolRecord | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Productivity");
  const [formPricing, setFormPricing] = useState("Freemium");
  const [formWebsite, setFormWebsite] = useState("");
  const [formOverview, setFormOverview] = useState("");
  const [formScore, setFormScore] = useState("92");

  const [saving, setSaving] = useState(false);

  /* ============================================================
     HELPERS
  ============================================================ */

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const getErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    try {
      const data = await response.json();

      if (typeof data?.error === "string") {
        return data.error;
      }

      if (typeof data?.message === "string") {
        return data.message;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    return fallback;
  };

  /* ============================================================
     CHECK AUTH SESSION
  ============================================================ */

  const checkAuth = useCallback(async () => {
    try {
      const response = await adminFetch("/api/admin/auth", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();

        if (data?.authenticated === true || data?.success === true) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /* ============================================================
     LOAD ADMIN DATA
  ============================================================ */

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        inquiryResponse,
        toolsResponse,
        submissionResponse,
        subscriberResponse,
        reviewResponse,
      ] = await Promise.allSettled([
        adminFetch("/api/admin/inquiries"),
        adminFetch("/api/admin/tools"),
        adminFetch("/api/admin/submissions"),
        adminFetch("/api/admin/subscribers"),
        adminFetch("/api/admin/reviews"),
      ]);

      /* ---------------- INQUIRIES ---------------- */

      if (inquiryResponse.status === "fulfilled") {
        if (inquiryResponse.value.ok) {
          const data = await inquiryResponse.value.json();
          setInquiries(data.inquiries || []);
        } else {
          console.error(
            "Inquiry API:",
            await getErrorMessage(
              inquiryResponse.value,
              "Failed to load inquiries"
            )
          );
        }
      }

      /* ---------------- TOOLS ---------------- */

      if (toolsResponse.status === "fulfilled") {
        if (toolsResponse.value.ok) {
          const data = await toolsResponse.value.json();

          setTools(
            Array.isArray(data.tools)
              ? data.tools
              : Array.isArray(data)
              ? data
              : []
          );
        } else {
          console.error(
            "Tools API:",
            await getErrorMessage(
              toolsResponse.value,
              "Failed to load tools"
            )
          );
        }
      }

      /* ---------------- SUBMISSIONS ---------------- */

      if (submissionResponse.status === "fulfilled") {
        if (submissionResponse.value.ok) {
          const data = await submissionResponse.value.json();

          setSubmissions(
            Array.isArray(data.submissions)
              ? data.submissions
              : Array.isArray(data)
              ? data
              : []
          );
        } else {
          console.error(
            "Submission API:",
            await getErrorMessage(
              submissionResponse.value,
              "Failed to load submissions"
            )
          );
        }
      }

      /* ---------------- SUBSCRIBERS ---------------- */

      if (subscriberResponse.status === "fulfilled") {
        if (subscriberResponse.value.ok) {
          const data = await subscriberResponse.value.json();

          setSubscribers(
            Array.isArray(data.subscribers)
              ? data.subscribers
              : Array.isArray(data)
              ? data
              : []
          );
        } else {
          console.error(
            "Subscriber API:",
            await getErrorMessage(
              subscriberResponse.value,
              "Failed to load subscribers"
            )
          );
        }
      }

      /* ---------------- REVIEWS ---------------- */

      if (reviewResponse.status === "fulfilled") {
        if (reviewResponse.value.ok) {
          const data = await reviewResponse.value.json();

          setReviews(
            Array.isArray(data.reviews)
              ? data.reviews
              : Array.isArray(data)
              ? data
              : []
          );
        } else {
          console.error(
            "Review API:",
            await getErrorMessage(
              reviewResponse.value,
              "Failed to load reviews"
            )
          );
        }
      }
    } catch (error) {
      console.error("Admin data loading error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, loadAdminData]);

  /* ============================================================
     LOGIN
  ============================================================ */

  const handlePinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setPinError(null);

    const pin = pinInput.trim();

    if (!pin) {
      setPinError("Please enter your admin PIN.");
      return;
    }

    try {
      setAuthLoading(true);

      const response = await adminFetch("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({
          pin,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Incorrect admin PIN."
        );

        setPinError(message);
        return;
      }

      const data = await response.json();

      if (!data?.success) {
        setPinError("Authentication failed.");
        return;
      }

      setPinInput("");
      setPinError(null);
      setIsAuthenticated(true);

      await loadAdminData();
    } catch (error) {
      console.error(error);
      setPinError("Unable to contact the authentication server.");
    } finally {
      setAuthLoading(false);
    }
  };

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = async () => {
    try {
      await adminFetch("/api/admin/auth", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setIsAuthenticated(false);
    setPinInput("");
  };

  /* ============================================================
     RESET / CHANGE PIN
  ============================================================ */

  const handleResetPinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setResetErrorMsg(null);

    const recovery = recoveryInput.trim();
    const newPin = newPinInput.trim();
    const confirmPin = confirmPinInput.trim();

    if (!recovery) {
      setResetErrorMsg("Recovery key is required.");
      return;
    }

    if (newPin.length < 8) {
      setResetErrorMsg("New PIN must contain at least 8 characters.");
      return;
    }

    if (newPin !== confirmPin) {
      setResetErrorMsg("New PIN and confirmation do not match.");
      return;
    }

    try {
      setResetLoading(true);

      const response = await adminFetch("/api/admin/auth/reset", {
        method: "POST",
        body: JSON.stringify({
          recovery_key: recovery,
          new_pin: newPin,
        }),
      });

      if (!response.ok) {
        setResetErrorMsg(
          await getErrorMessage(
            response,
            "Unable to reset the admin PIN."
          )
        );
        return;
      }

      setRecoveryInput("");
      setNewPinInput("");
      setConfirmPinInput("");
      setShowResetModal(false);

      showToast("✓ Admin security PIN updated.");

      await checkAuth();
    } catch (error) {
      console.error(error);
      setResetErrorMsg("Network error while changing the PIN.");
    } finally {
      setResetLoading(false);
    }
  };

  /* ============================================================
     COPY EMAIL
  ============================================================ */

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);

      window.setTimeout(() => {
        setCopiedEmail(null);
      }, 2000);
    } catch {
      showToast("Unable to copy email.");
    }
  };

  /* ============================================================
     EXTRACT FOUNDER EMAIL
  ============================================================ */

  const extractFounderEmail = (tool: ToolRecord): string => {
    if (
      tool.founder_email &&
      String(tool.founder_email).includes("@")
    ) {
      return String(tool.founder_email).trim();
    }

    if (
      tool.submitter_email &&
      String(tool.submitter_email).includes("@")
    ) {
      return String(tool.submitter_email).trim();
    }

    if (tool.affiliate_network) {
      const emailRegex =
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

      const match = String(tool.affiliate_network).match(emailRegex);

      if (match) {
        return match[1].trim();
      }
    }

    return "Not Provided";
  };

  /* ============================================================
     EXTRACT SUBMISSION TIER
  ============================================================ */

  const extractTier = (tool: ToolRecord): string => {
    if (tool.submission_tier) {
      return String(tool.submission_tier).toUpperCase();
    }

    if (
      tool.affiliate_network &&
      String(tool.affiliate_network).includes("Tier:")
    ) {
      const match = String(tool.affiliate_network).match(
        /Tier:\s*([^|]+)/
      );

      if (match) {
        return match[1].trim();
      }
    }

    const score = Number(tool.score || tool.ai_vault_score || 0);

    if (score >= 98) {
      return "CATEGORY TAKEOVER";
    }

    if (score >= 95) {
      return "FEATURED BOOST";
    }

    return "STARTER REVIEW";
  };

  /* ============================================================
     SUBMISSION MODERATION
  ============================================================ */

  const handleModerateSubmission = async (
    tool: ToolRecord,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await adminFetch("/api/admin/submissions", {
        method: "POST",
        body: JSON.stringify({
          id: tool.id,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Moderation failed."
          )
        );
      }

      setSubmissions((previous) =>
        previous.filter((item) => item.id !== tool.id)
      );

      if (action === "approve") {
        setTools((previous) => [tool, ...previous]);

        showToast(
          `✓ "${tool.name || "Tool"}" approved and published.`
        );
      } else {
        showToast(
          `Submission for "${tool.name || "Tool"}" rejected.`
        );
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Moderation failed."
      );
    }
  };

  /* ============================================================
     DELETE INQUIRY
  ============================================================ */

  const handleDeleteInquiry = async (
    id: string | number
  ) => {
    if (!window.confirm("Delete this inquiry?")) {
      return;
    }

    try {
      const response = await adminFetch("/api/admin/inquiries", {
        method: "POST",
        body: JSON.stringify({
          id,
          action: "delete",
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete inquiry."
          )
        );
      }

      setInquiries((previous) =>
        previous.filter((item) => item.id !== id)
      );

      showToast("Inquiry deleted.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete inquiry."
      );
    }
  };

  /* ============================================================
     MARK INQUIRY READ
  ============================================================ */

  const handleMarkInquiryRead = async (
    id: string | number
  ) => {
    try {
      const response = await adminFetch("/api/admin/inquiries", {
        method: "POST",
        body: JSON.stringify({
          id,
          action: "read",
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to mark inquiry as read."
          )
        );
      }

      setInquiries((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "read",
              }
            : item
        )
      );

      showToast("✓ Inquiry marked as read.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to update inquiry."
      );
    }
  };

  /* ============================================================
     AUTO INGEST
  ============================================================ */

  const handleIngest10Tools = async () => {
    try {
      setIsIngesting(true);
      setIngestMessage("");

      const response = await adminFetch("/api/ingest", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to ingest AI tools."
          )
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Tool ingestion failed."
        );
      }

      const count = Number(data.new_tools_added || 10);

      setIngestMessage(
        `✅ Successfully added ${count} new AI tools.`
      );

      showToast(`✓ Added ${count} new AI tools.`);

      await loadAdminData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Network error.";

      setIngestMessage(`❌ ${message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  /* ============================================================
     AUTO DISCOVER AFFILIATES
  ============================================================ */

  const [discovering, setDiscovering] = useState(false);

  const handleAutoDiscover = async () => {
    try {
      setDiscovering(true);

      showToast(
        "⚡ Scanning tools for verified affiliate links..."
      );

      const response = await adminFetch(
        "/api/admin/auto-discover",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Affiliate discovery failed."
          )
        );
      }

      await loadAdminData();

      showToast(
        "✓ Affiliate discovery synchronization completed."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Affiliate discovery failed."
      );
    } finally {
      setDiscovering(false);
    }
  };

  /* ============================================================
     OPEN AFFILIATE CONFIG
  ============================================================ */

  const handleOpenConfigure = (tool: ToolRecord) => {
    setSelectedTool(tool);

    setEditWebsiteUrl(
      String(tool.website_url || tool.website || "")
    );

    setEditAffiliateUrl(
      String(tool.affiliate_url || "")
    );

    setEditNetwork(
      String(tool.affiliate_network || "Direct")
    );
  };

  /* ============================================================
     SAVE AFFILIATE CONFIG
  ============================================================ */

  const handleSaveAffiliate = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedTool) {
      return;
    }

    try {
      setSaving(true);

      const response = await adminFetch(
        "/api/admin/update-tool",
        {
          method: "POST",
          body: JSON.stringify({
            id: selectedTool.id,
            slug: selectedTool.slug,
            website_url: editWebsiteUrl.trim(),
            affiliate_url: editAffiliateUrl.trim(),
            affiliate_network: editNetwork,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to save affiliate settings."
          )
        );
      }

      const toolName = selectedTool.name || "Tool";

      setSelectedTool(null);

      await loadAdminData();

      showToast(
        `✓ Affiliate settings saved for ${toolName}.`
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save affiliate settings."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     REMOVE AFFILIATE
  ============================================================ */

  const handleRemoveAffiliate = async () => {
    if (!selectedTool) {
      return;
    }

    if (
      !window.confirm(
        `Remove affiliate configuration for "${selectedTool.name}"?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      const response = await adminFetch(
        "/api/admin/update-tool",
        {
          method: "POST",
          body: JSON.stringify({
            id: selectedTool.id,
            slug: selectedTool.slug,
            affiliate_url: "",
            affiliate_network: "Direct",
            affiliate_status: null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to remove affiliate."
          )
        );
      }

      const toolName = selectedTool.name || "Tool";

      setSelectedTool(null);

      await loadAdminData();

      showToast(
        `✓ Affiliate removed from ${toolName}.`
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to remove affiliate."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     SLUG
  ============================================================ */

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  /* ============================================================
     SAVE TOOL
  ============================================================ */

  const handleSaveToolRecord = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const name = formName.trim();

    if (!name) {
      return;
    }

    if (formWebsite.trim()) {
      try {
        new URL(formWebsite.trim());
      } catch {
        alert("Please enter a valid website URL.");
        return;
      }
    }

    const score = Number(formScore);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      alert("Score must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        slug: generateSlug(name),
        category: formCategory,
        pricing: formPricing,
        website_url: formWebsite.trim(),
        description: formOverview.trim(),
        overview: formOverview.trim(),
        score,
        ai_vault_score: score,
      };

      const response = await adminFetch("/api/admin/tools", {
        method: editingToolRecord ? "PATCH" : "POST",
        body: JSON.stringify(
          editingToolRecord
            ? {
                ...payload,
                id: editingToolRecord.id,
              }
            : payload
        ),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to save tool."
          )
        );
      }

      showToast(
        editingToolRecord
          ? `✓ Updated ${name}.`
          : `✓ Added ${name}.`
      );

      setIsAddModalOpen(false);
      setEditingToolRecord(null);

      await loadAdminData();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save tool."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE TOOL
  ============================================================ */

  const handleDeleteTool = async (
    tool: ToolRecord
  ) => {
    if (
      !window.confirm(
        `Delete "${tool.name || "this tool"}" permanently?`
      )
    ) {
      return;
    }

    try {
      const response = await adminFetch("/api/admin/tools", {
        method: "DELETE",
        body: JSON.stringify({
          id: tool.id,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete tool."
          )
        );
      }

      setTools((previous) =>
        previous.filter((item) => item.id !== tool.id)
      );

      showToast(
        `Deleted ${tool.name || "tool"}.`
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete tool."
      );
    }
  };

  /* ============================================================
     DELETE REVIEW
  ============================================================ */

  const handleDeleteReview = async (
    id: string | number
  ) => {
    if (!window.confirm("Delete this review?")) {
      return;
    }

    try {
      const response = await adminFetch("/api/admin/reviews", {
        method: "POST",
        body: JSON.stringify({
          id,
          action: "delete",
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete review."
          )
        );
      }

      setReviews((previous) =>
        previous.filter((review) => review.id !== id)
      );

      showToast("Review deleted.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete review."
      );
    }
  };

  /* ============================================================
     DELETE SUBSCRIBER
  ============================================================ */

  const handleDeleteSubscriber = async (
    id: string | number
  ) => {
    if (!window.confirm("Delete this subscriber?")) {
      return;
    }

    try {
      const response = await adminFetch(
        "/api/admin/subscribers",
        {
          method: "DELETE",
          body: JSON.stringify({
            id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete subscriber."
          )
        );
      }

      setSubscribers((previous) =>
        previous.filter((item) => item.id !== id)
      );

      showToast("Subscriber deleted.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete subscriber."
      );
    }
  };

  /* ============================================================
     EXPORT CSV
  ============================================================ */

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      alert("No subscribers to export.");
      return;
    }

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Email",
      "Source",
      "Tool Slug",
      "Subscribed Date",
    ];

    const rows = subscribers.map((subscriber) =>
      [
        subscriber.email,
        subscriber.source || "global_footer",
        subscriber.tool_slug || "",
        subscriber.created_at
          ? new Date(subscriber.created_at).toISOString()
          : "",
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `aivault_subscribers_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("✓ CSV export created.");
  };

  /* ============================================================
     FILTERED TOOLS
  ============================================================ */

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesSearch =
        !query ||
        String(tool.name || "")
          .toLowerCase()
          .includes(query) ||
        String(tool.slug || "")
          .toLowerCase()
          .includes(query) ||
        String(tool.category || "")
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      const monetized =
        Boolean(tool.affiliate_url) &&
        String(tool.affiliate_url).trim().length > 0;

      if (
        statusFilter === "monetized" &&
        !monetized
      ) {
        return false;
      }

      if (
        statusFilter === "discovery_required" &&
        monetized
      ) {
        return false;
      }

      return true;
    });
  }, [tools, search, statusFilter]);

  /* ============================================================
     METRICS
  ============================================================ */

  const metrics = useMemo(() => {
    const total = tools.length;

    const active = tools.filter(
      (tool) =>
        Boolean(tool.affiliate_url) &&
        String(tool.affiliate_url).trim().length > 0
    ).length;

    const pending = total - active;

    const clicks = tools.reduce(
      (totalClicks, tool) =>
        totalClicks + Number(tool.click_count || 0),
      0
    );

    const revenue = tools.reduce(
      (totalRevenue, tool) =>
        totalRevenue + Number(tool.revenue_usd || 0),
      0
    );

    const unreadMessages = inquiries.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "unread"
    ).length;

    return {
      total,
      active,
      pending,
      clicks,
      revenue,
      unreadMessages,
    };
  }, [tools, inquiries]);

  /* ============================================================
     MODAL OPEN HELPERS
  ============================================================ */

  const openAddToolModal = () => {
    setEditingToolRecord(null);
    setFormName("");
    setFormCategory("Productivity");
    setFormPricing("Freemium");
    setFormWebsite("");
    setFormOverview("");
    setFormScore("92");
    setIsAddModalOpen(true);
  };

  const openEditToolModal = (tool: ToolRecord) => {
    setEditingToolRecord(tool);

    setFormName(String(tool.name || ""));
    setFormCategory(
      String(tool.category || "Productivity")
    );
    setFormPricing(
      String(tool.pricing || "Freemium")
    );
    setFormWebsite(
      String(tool.website_url || tool.website || "")
    );
    setFormOverview(
      String(
        tool.overview ||
          tool.description ||
          ""
      )
    );

    setFormScore(
      String(
        tool.score ||
          tool.ai_vault_score ||
          92
      )
    );

    setIsAddModalOpen(true);
  };

  /* ============================================================
     AUTH CHECK SCREEN
  ============================================================ */

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#070a1e] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-slate-400">
            Verifying admin session...
          </p>
        </div>
      </main>
    );
  }

  /* ============================================================
     LOGIN SCREEN
  ============================================================ */

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#070a1e] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c102b] p-7 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-3xl">
              🔒
            </div>

            <h1 className="mt-5 text-xl font-black text-white">
              Admin Command Gate
            </h1>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Secure administrator authentication required.
            </p>
          </div>

          {pinError && (
            <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
              {pinError}
            </div>
          )}

          <form
            onSubmit={handlePinSubmit}
            className="mt-6 space-y-3"
          >
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Admin PIN
              </span>

              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                value={pinInput}
                onChange={(event) =>
                  setPinInput(event.target.value)
                }
                placeholder="Enter secure PIN"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-sm tracking-[0.35em] text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </label>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {authLoading
                ? "Authenticating..."
                : "Unlock Dashboard →"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
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

          <p className="mt-5 text-center text-[9px] leading-relaxed text-slate-600">
            Authentication is handled server-side.
            <br />
            Never expose recovery secrets in client code.
          </p>
        </div>

        {/* RESET MODAL */}

        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span>🔑</span>

                  <h2 className="text-sm font-black text-white">
                    Reset Admin PIN
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowResetModal(false)
                  }
                  className="text-sm font-bold text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {resetErrorMsg && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
                  {resetErrorMsg}
                </div>
              )}

              <form
                onSubmit={handleResetPinSubmit}
                className="space-y-4"
              >
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    Recovery Key
                  </span>

                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={recoveryInput}
                    onChange={(event) =>
                      setRecoveryInput(
                        event.target.value
                      )
                    }
                    placeholder="Enter recovery key"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    New PIN
                  </span>

                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={newPinInput}
                    onChange={(event) =>
                      setNewPinInput(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    Confirm New PIN
                  </span>

                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPinInput}
                    onChange={(event) =>
                      setConfirmPinInput(
                        event.target.value
                      )
                    }
                    placeholder="Repeat new PIN"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </label>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowResetModal(false)
                    }
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {resetLoading
                      ? "Updating..."
                      : "Update PIN"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* ============================================================
     MAIN DASHBOARD
  ============================================================ */

  return (
    <main className="min-h-screen bg-[#070a1e] text-white">
      {/* TOAST */}

      {toastMessage && (
        <div className="fixed right-4 top-4 z-[100] max-w-sm rounded-xl border border-emerald-500/30 bg-[#0c102b] px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070a1e]/90 px-4 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="shrink-0 text-lg font-black tracking-tight text-white"
            >
              AI Vault
              <span className="text-blue-500">.</span>
            </Link>

            <span className="hidden rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-400 sm:inline-block">
              Master Admin Suite
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setResetErrorMsg(null);
                setShowResetModal(true);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              🔑 Change PIN
            </button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Public Site ↗
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-400 hover:border-slate-700 hover:text-white"
            >
              🔒 Lock
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {/* NAVIGATION */}

        <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() =>
              setActiveTab("inquiries")
            }
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "inquiries"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✉️ Inquiries

            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
              {inquiries.length}
            </span>

            {metrics.unreadMessages > 0 && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-black">
                {metrics.unreadMessages} new
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setActiveTab("submissions")
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "submissions"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📥 Submissions

            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-300">
              {submissions.length}
            </span>
          </button>

          <button
            onClick={() =>
              setActiveTab("affiliate")
            }
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "affiliate"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📊 Affiliate Hub
          </button>

          <button
            onClick={() =>
              setActiveTab("catalog")
            }
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "catalog"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🛠️ Catalog ({tools.length})
          </button>

          <button
            onClick={() =>
              setActiveTab("reviews")
            }
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "reviews"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⭐ Reviews ({reviews.length})
          </button>

          <button
            onClick={() =>
              setActiveTab("subscribers")
            }
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "subscribers"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📧 Leads ({subscribers.length})
          </button>
        </div>

        {/* ======================================================
            INQUIRIES
        ====================================================== */}

        {activeTab === "inquiries" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Direct Contact Inquiries (
                  {inquiries.length})
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Founder messages, verification requests and
                  support tickets.
                </p>
              </div>

              <button
                onClick={loadAdminData}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                🔄 Refresh
              </button>
            </div>

            {inquiries.length === 0 ? (
              <EmptyState text="No contact inquiries received yet." />
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => {
                  const mailto = `mailto:${
                    inquiry.email
                  }?subject=${encodeURIComponent(
                    `AI Vault Update: ${
                      inquiry.tool_name ||
                      inquiry.subject ||
                      "Your Inquiry"
                    }`
                  )}&body=${encodeURIComponent(
                    `Hi ${
                      inquiry.name || "Founder"
                    },\n\nRegarding your message on AI Vault:\n\n`
                  )}`;

                  const isUnread =
                    String(
                      inquiry.status || ""
                    ).toLowerCase() === "unread";

                  return (
                    <article
                      key={String(inquiry.id)}
                      className={`rounded-2xl border p-5 ${
                        isUnread
                          ? "border-blue-500/40 bg-[#0c133a]"
                          : "border-slate-800 bg-[#0c102b]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-600/20 text-sm font-black text-blue-400">
                            {(
                              inquiry.name?.[0] ||
                              inquiry.email?.[0] ||
                              "M"
                            ).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-white">
                                {inquiry.name ||
                                  "Founder"}
                              </h3>

                              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-300">
                                {inquiry.issue_type ||
                                  inquiry.subject ||
                                  "Inquiry"}
                              </span>

                              {isUnread && (
                                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[8px] font-black uppercase text-black">
                                  New
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <a
                                href={`mailto:${inquiry.email}`}
                                className="text-xs font-mono font-bold text-blue-400 hover:underline"
                              >
                                {inquiry.email}
                              </a>

                              <button
                                onClick={() =>
                                  handleCopyEmail(
                                    inquiry.email
                                  )
                                }
                                className="text-[10px] font-bold text-slate-500 hover:text-white"
                              >
                                {copiedEmail ===
                                inquiry.email
                                  ? "✓ Copied"
                                  : "📋 Copy"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] font-mono text-slate-500">
                          {inquiry.created_at
                            ? new Date(
                                inquiry.created_at
                              ).toLocaleString()
                            : "Recent"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <MetaCard
                          label="Related Tool"
                          value={
                            inquiry.tool_name ||
                            "General Inquiry"
                          }
                        />

                        <MetaCard
                          label="Subject"
                          value={
                            inquiry.subject ||
                            "Verification Request"
                          }
                        />

                        <MetaCard
                          label="Reference"
                          value={
                            inquiry.transaction_id ||
                            "Direct Message"
                          }
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-800 bg-black/40 p-4 text-xs leading-relaxed text-slate-200">
                        {inquiry.message ||
                          "No message content."}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {isUnread && (
                          <button
                            onClick={() =>
                              handleMarkInquiryRead(
                                inquiry.id
                              )
                            }
                            className="rounded-xl border border-emerald-500/30 bg-emerald-600/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white"
                          >
                            ✓ Mark Read
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleDeleteInquiry(
                              inquiry.id
                            )
                          }
                          className="rounded-xl border border-rose-600/30 bg-rose-600/10 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                        >
                          Delete
                        </button>

                        <a
                          href={mailto}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                        >
                          Reply via Email ↗
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ======================================================
            SUBMISSIONS
        ====================================================== */}

        {activeTab === "submissions" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Pending Founder Submissions (
                  {submissions.length})
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Review tools before publishing them to the
                  public directory.
                </p>
              </div>

              <button
                onClick={loadAdminData}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                🔄 Refresh
              </button>
            </div>

            {submissions.length === 0 ? (
              <EmptyState text="No pending submissions. All tools reviewed." />
            ) : (
              <div className="space-y-4">
                {submissions.map((tool) => {
                  const founderEmail =
                    extractFounderEmail(tool);

                  const tierName =
                    extractTier(tool);

                  const website = String(
                    tool.website_url ||
                      tool.website ||
                      ""
                  );

                  const mailto =
                    founderEmail !== "Not Provided"
                      ? `mailto:${founderEmail}?subject=${encodeURIComponent(
                          `AI Vault Update: ${
                            tool.name ||
                            "Tool"
                          } Approval Status`
                        )}`
                      : "#";

                  return (
                    <article
                      key={String(tool.id)}
                      className="rounded-3xl border border-slate-800 bg-[#0c102b] p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 border-b border-slate-800 pb-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <ToolLogo
                            name={
                              tool.name ||
                              "AI Tool"
                            }
                            src={
                              tool.logo_url ||
                              tool.logo
                            }
                            website={website}
                            slug={
                              tool.slug ||
                              undefined
                            }
                            size="md"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-white">
                                {tool.name ||
                                  "Unnamed Tool"}
                              </h3>

                              <Badge>
                                {tool.category ||
                                  "Productivity"}
                              </Badge>

                              <Badge>
                                {tool.pricing ||
                                  "Freemium"}
                              </Badge>

                              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                                {tierName}
                              </span>
                            </div>

                            {website && (
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 block break-all text-xs font-mono text-blue-400 hover:underline"
                              >
                                {website} ↗
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 lg:min-w-[260px]">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-blue-300">
                            Founder Contact
                          </span>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-mono font-black text-white">
                              {founderEmail}
                            </span>

                            {founderEmail !==
                              "Not Provided" && (
                              <button
                                onClick={() =>
                                  handleCopyEmail(
                                    founderEmail
                                  )
                                }
                                className="shrink-0 rounded-lg border border-blue-400/30 bg-blue-600/30 px-2 py-1 text-[9px] font-bold text-white"
                              >
                                {copiedEmail ===
                                founderEmail
                                  ? "✓"
                                  : "Copy"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <span className="mb-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                          Product Overview
                        </span>

                        <div className="rounded-2xl border border-slate-800 bg-black/40 p-4 text-xs leading-relaxed text-slate-300">
                          {tool.description ||
                            tool.overview ||
                            "No description provided."}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-[10px] font-mono text-slate-500">
                          Submitted:{" "}
                          {tool.created_at
                            ? new Date(
                                tool.created_at
                              ).toLocaleString()
                            : "Recently"}
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {founderEmail !==
                            "Not Provided" && (
                            <a
                              href={mailto}
                              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                            >
                              ✉️ Email Founder
                            </a>
                          )}

                          <button
                            onClick={() =>
                              handleModerateSubmission(
                                tool,
                                "reject"
                              )
                            }
                            className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900"
                          >
                            ✕ Reject
                          </button>

                          <button
                            onClick={() =>
                              handleModerateSubmission(
                                tool,
                                "approve"
                              )
                            }
                            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            ✓ Approve & Publish
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ======================================================
            AFFILIATE HUB
        ====================================================== */}

        {activeTab === "affiliate" && (
          <div>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MetricCard
                label="Total Directory"
                value={metrics.total}
                footer="Indexed tools"
              />

              <MetricCard
                label="Active Links"
                value={metrics.active}
                footer="Monetized"
                valueClass="text-emerald-400"
              />

              <MetricCard
                label="Discovery Required"
                value={metrics.pending}
                footer="Needs review"
                valueClass="text-amber-400"
              />

              <MetricCard
                label="Total Clicks"
                value={metrics.clicks}
                footer="Tracked clicks"
                valueClass="text-blue-400"
              />

              <MetricCard
                label="Confirmed Revenue"
                value={`$${metrics.revenue.toFixed(
                  2
                )}`}
                footer="Network reports"
                valueClass="text-emerald-400"
                wide
              />
            </div>

            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0c102b] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                  Affiliate Discovery
                </span>

                <h3 className="mt-0.5 text-sm font-black text-white">
                  Synchronize monetization opportunities
                </h3>
              </div>

              <button
                onClick={handleAutoDiscover}
                disabled={discovering}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
              >
                {discovering
                  ? "Synchronizing..."
                  : "AUTO DISCOVER AFFILIATES ⚙"}
              </button>
            </div>

            <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-5 shadow-xl sm:p-6">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-black text-white">
                  Affiliate Links Index
                </h2>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
                    {(
                      [
                        ["all", "All"],
                        ["monetized", "Active"],
                        [
                          "discovery_required",
                          "Pending",
                        ],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() =>
                          setStatusFilter(value)
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          statusFilter === value
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search tools..."
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState />
              ) : filteredTools.length === 0 ? (
                <EmptyState text="No matching tools found." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="pb-3">
                          Tool
                        </th>
                        <th className="pb-3">
                          Category
                        </th>
                        <th className="pb-3">
                          Status
                        </th>
                        <th className="pb-3">
                          Clicks
                        </th>
                        <th className="pb-3">
                          Network
                        </th>
                        <th className="pb-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredTools.map((tool) => {
                        const slug = String(
                          tool.slug || ""
                        );

                        const monetized =
                          Boolean(
                            tool.affiliate_url
                          ) &&
                          String(
                            tool.affiliate_url
                          ).trim().length > 0;

                        return (
                          <tr
                            key={String(
                              tool.id
                            )}
                            className="hover:bg-slate-900/40"
                          >
                            <td className="py-3.5 pr-4">
                              <p className="font-bold text-white">
                                {tool.name ||
                                  "Unnamed"}
                              </p>

                              <p className="text-[10px] text-slate-500">
                                /tool/{slug}
                              </p>
                            </td>

                            <td className="py-3.5 pr-4 text-slate-400">
                              {tool.category ||
                                "AI"}
                            </td>

                            <td className="py-3.5 pr-4">
                              {monetized ? (
                                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black text-emerald-400">
                                  MONETIZED
                                </span>
                              ) : (
                                <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-400">
                                  DISCOVERY
                                  REQUIRED
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 pr-4 font-black text-blue-400">
                              {Number(
                                tool.click_count ||
                                  0
                              )}
                            </td>

                            <td className="py-3.5 pr-4 text-slate-400">
                              {tool.affiliate_network ||
                                "Direct"}
                            </td>

                            <td className="py-3.5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <a
                                  href={`/go/${encodeURIComponent(
                                    slug
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-blue-600 hover:text-white"
                                >
                                  Test /go ↗
                                </a>

                                <button
                                  onClick={() =>
                                    handleOpenConfigure(
                                      tool
                                    )
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-black text-white hover:bg-blue-700"
                                >
                                  Configure
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ======================================================
            CATALOG
        ====================================================== */}

        {activeTab === "catalog" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Full Catalog Manager
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Add, edit, delete and ingest AI tools.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleIngest10Tools}
                  disabled={isIngesting}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isIngesting
                    ? "Generating..."
                    : "⚡ Auto-Ingest 10 AI Tools"}
                </button>

                <button
                  onClick={openAddToolModal}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                >
                  + Add New Tool
                </button>
              </div>
            </div>

            {ingestMessage && (
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-300">
                <span>{ingestMessage}</span>

                <button
                  onClick={() =>
                    setIngestMessage("")
                  }
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {tools.length === 0 ? (
              <EmptyState text="No tools found in the catalog." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="pb-3">
                        Tool
                      </th>
                      <th className="pb-3">
                        Category
                      </th>
                      <th className="pb-3">
                        Pricing
                      </th>
                      <th className="pb-3">
                        Score
                      </th>
                      <th className="pb-3 text-right">
                        Manage
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {tools.map((tool) => (
                      <tr
                        key={String(tool.id)}
                        className="hover:bg-slate-900/40"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="font-bold text-white">
                            {tool.name ||
                              "Unnamed"}
                          </p>

                          <p className="text-[10px] text-slate-500">
                            /tool/
                            {tool.slug}
                          </p>
                        </td>

                        <td className="py-3.5 pr-4 text-slate-400">
                          {tool.category ||
                            "AI"}
                        </td>

                        <td className="py-3.5 pr-4 text-slate-300">
                          {tool.pricing ||
                            "Freemium"}
                        </td>

                        <td className="py-3.5 pr-4 font-black text-blue-400">
                          {Number(
                            tool.score ||
                              tool.ai_vault_score ||
                              90
                          )}
                          /100
                        </td>

                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/tool/${encodeURIComponent(
                                String(
                                  tool.slug ||
                                    ""
                                )
                              )}`}
                              target="_blank"
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                            >
                              View ↗
                            </Link>

                            <button
                              onClick={() =>
                                openEditToolModal(
                                  tool
                                )
                              }
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteTool(
                                  tool
                                )
                              }
                              className="rounded-lg border border-rose-600/30 bg-rose-600/10 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ======================================================
            REVIEWS
        ====================================================== */}

        {activeTab === "reviews" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Community Reviews (
                  {reviews.length})
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Manage reviews submitted on tool pages.
                </p>
              </div>

              <button
                onClick={loadAdminData}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                🔄 Refresh
              </button>
            </div>

            {reviews.length === 0 ? (
              <EmptyState text="No reviews submitted yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="pb-3">
                        Author
                      </th>
                      <th className="pb-3">
                        Tool
                      </th>
                      <th className="pb-3">
                        Rating
                      </th>
                      <th className="pb-3">
                        Comment
                      </th>
                      <th className="pb-3">
                        Date
                      </th>
                      <th className="pb-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {reviews.map((review) => {
                      const rating = Math.max(
                        0,
                        Math.min(
                          5,
                          Number(
                            review.rating || 0
                          )
                        )
                      );

                      return (
                        <tr
                          key={String(
                            review.id
                          )}
                          className="hover:bg-slate-900/40"
                        >
                          <td className="py-3.5 pr-4 font-bold text-white">
                            {review.author_name ||
                              "Anonymous"}
                          </td>

                          <td className="py-3.5 pr-4">
                            <Link
                              href={`/tool/${encodeURIComponent(
                                review.tool_slug
                              )}`}
                              target="_blank"
                              className="text-blue-400 hover:underline"
                            >
                              /tool/
                              {
                                review.tool_slug
                              }{" "}
                              ↗
                            </Link>
                          </td>

                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className="text-amber-400">
                              {"★".repeat(
                                rating
                              )}
                              {"☆".repeat(
                                5 - rating
                              )}
                            </span>

                            <span className="ml-1 text-[10px] text-slate-500">
                              ({rating}/5)
                            </span>
                          </td>

                          <td className="max-w-xs truncate py-3.5 pr-4 text-slate-300">
                            {review.comment}
                          </td>

                          <td className="py-3.5 pr-4 text-[10px] text-slate-500">
                            {review.created_at
                              ? new Date(
                                  review.created_at
                                ).toLocaleDateString()
                              : "Recent"}
                          </td>

                          <td className="py-3.5 text-right">
                            <button
                              onClick={() =>
                                handleDeleteReview(
                                  review.id
                                )
                              }
                              className="rounded-lg border border-rose-600/30 bg-rose-600/10 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ======================================================
            SUBSCRIBERS
        ====================================================== */}

        {activeTab === "subscribers" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Email Leads & Subscribers (
                  {subscribers.length})
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Captured newsletter and alert subscribers.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
              >
                📥 Export CSV
              </button>
            </div>

            {subscribers.length === 0 ? (
              <EmptyState text="No email subscribers collected yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="pb-3">
                        Email
                      </th>
                      <th className="pb-3">
                        Source
                      </th>
                      <th className="pb-3">
                        Date
                      </th>
                      <th className="pb-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {subscribers.map(
                      (subscriber) => (
                        <tr
                          key={String(
                            subscriber.id
                          )}
                          className="hover:bg-slate-900/40"
                        >
                          <td className="py-3.5 pr-4 font-bold text-white">
                            {subscriber.email}
                          </td>

                          <td className="py-3.5 pr-4">
                            <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-blue-400">
                              {subscriber.source ||
                                "global_footer"}
                            </span>
                          </td>

                          <td className="py-3.5 pr-4 text-slate-400">
                            {subscriber.created_at
                              ? new Date(
                                  subscriber.created_at
                                ).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "Recent"}
                          </td>

                          <td className="py-3.5 text-right">
                            <button
                              onClick={() =>
                                handleDeleteSubscriber(
                                  subscriber.id
                                )
                              }
                              className="rounded-lg border border-rose-600/30 bg-rose-600/10 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ========================================================
          AFFILIATE CONFIG MODAL
      ======================================================== */}

      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-white">
                  Configure Links & Tracking
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {selectedTool.name}{" "}
                  (/tool/
                  {selectedTool.slug})
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedTool(null)
                }
                className="text-sm font-bold text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveAffiliate}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  Official Website URL
                </span>

                <input
                  type="url"
                  value={editWebsiteUrl}
                  onChange={(event) =>
                    setEditWebsiteUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-blue-400">
                  Affiliate Redirect URL
                </span>

                <input
                  type="url"
                  value={editAffiliateUrl}
                  onChange={(event) =>
                    setEditAffiliateUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/?ref=..."
                  className="w-full rounded-xl border border-blue-500 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  Affiliate Network
                </span>

                <select
                  value={editNetwork}
                  onChange={(event) =>
                    setEditNetwork(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none"
                >
                  {AFFILIATE_NETWORKS.map(
                    (network) => (
                      <option
                        key={network}
                        value={network}
                      >
                        {network}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={
                    handleRemoveAffiliate
                  }
                  disabled={saving}
                  className="rounded-xl border border-rose-600/30 bg-rose-600/10 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white disabled:opacity-50"
                >
                  Remove Affiliate
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTool(null)
                    }
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Configuration"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT TOOL MODAL
      ======================================================== */}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white">
                {editingToolRecord
                  ? `Edit ${
                      editingToolRecord.name ||
                      "Tool"
                    }`
                  : "Add New AI Tool"}
              </h3>

              <button
                onClick={() =>
                  setIsAddModalOpen(false)
                }
                className="text-sm font-bold text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveToolRecord}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  Tool Name
                </span>

                <input
                  required
                  value={formName}
                  onChange={(event) =>
                    setFormName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. ChatEngine Pro"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    Category
                  </span>

                  <select
                    value={formCategory}
                    onChange={(event) =>
                      setFormCategory(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white"
                  >
                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    Pricing
                  </span>

                  <select
                    value={formPricing}
                    onChange={(event) =>
                      setFormPricing(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white"
                  >
                    {PRICING_OPTIONS.map(
                      (pricing) => (
                        <option
                          key={pricing}
                          value={pricing}
                        >
                          {pricing}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    Website URL
                  </span>

                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(event) =>
                      setFormWebsite(
                        event.target.value
                      )
                    }
                    placeholder="https://example.ai"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                    AI Vault Score
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formScore}
                    onChange={(event) =>
                      setFormScore(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  Overview / Description
                </span>

                <textarea
                  rows={5}
                  value={formOverview}
                  onChange={(event) =>
                    setFormOverview(
                      event.target.value
                    )
                  }
                  placeholder="Describe what the tool does..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setIsAddModalOpen(false)
                  }
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingToolRecord
                    ? "Update Tool"
                    : "Save Tool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CHANGE PIN MODAL
      ======================================================== */}

      {showResetModal && isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span>🔑</span>

                <h3 className="text-sm font-black text-white">
                  Update Admin Security PIN
                </h3>
              </div>

              <button
                onClick={() =>
                  setShowResetModal(false)
                }
                className="text-sm font-bold text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {resetErrorMsg && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
                {resetErrorMsg}
              </div>
            )}

            <form
              onSubmit={handleResetPinSubmit}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  Recovery Key
                </span>

                <input
                  type="password"
                  required
                  autoComplete="off"
                  value={recoveryInput}
                  onChange={(event) =>
                    setRecoveryInput(
                      event.target.value
                    )
                  }
                  placeholder="Enter recovery key"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  New PIN
                </span>

                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPinInput}
                  onChange={(event) =>
                    setNewPinInput(
                      event.target.value
                    )
                  }
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase text-slate-400">
                  Confirm New PIN
                </span>

                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPinInput}
                  onChange={(event) =>
                    setConfirmPinInput(
                      event.target.value
                    )
                  }
                  placeholder="Repeat new PIN"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowResetModal(false)
                  }
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {resetLoading
                    ? "Updating..."
                    : "Update PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* ================================================================
   SMALL UI COMPONENTS
================================================================ */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 p-12 text-center text-xs text-slate-500">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-10 text-center text-xs text-slate-500">
      <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      Loading admin data...
    </div>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400">
      {children}
    </span>
  );
}

function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
      <span className="block text-[9px] font-bold uppercase text-slate-500">
        {label}
      </span>

      <span className="mt-1 block truncate text-xs font-bold text-slate-200">
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  footer,
  valueClass = "text-white",
  wide = false,
}: {
  label: string;
  value: string | number;
  footer: string;
  valueClass?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-[#0c102b] p-4 ${
        wide ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-500">
        {footer}
      </p>
    </div>
  );
}
