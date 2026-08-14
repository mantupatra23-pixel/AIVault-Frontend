"use client";

const TRAFFIC_API =
  process.env.NEXT_PUBLIC_TRAFFIC_ENGINE_URL ||
  "https://aivault-faqc.onrender.com/api/traffic-engine";

const SESSION_KEY = "aivault_traffic_session";

type TrafficEvent = {
  event: "page_view" | "tool_impression" | "tool_click";
  page?: string;
  tool_slug?: string;
  tool_name?: string;
  category?: string;
  position?: number;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let session = sessionStorage.getItem(SESSION_KEY);

  if (!session) {
    session =
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    sessionStorage.setItem(SESSION_KEY, session);
  }

  return session;
}

function getTrafficSource() {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      medium: "none",
      campaign: "",
    };
  }

  const params = new URLSearchParams(window.location.search);

  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");

  let source = utmSource || "";
  let medium = utmMedium || "";

  if (!source) {
    const referrer = document.referrer;

    if (!referrer) {
      source = "direct";
      medium = "none";
    } else {
      try {
        source = new URL(referrer).hostname;
        medium = "referral";
      } catch {
        source = "unknown";
        medium = "referral";
      }
    }
  }

  return {
    source,
    medium: medium || "unknown",
    campaign: utmCampaign || "",
  };
}

async function sendTrafficEvent(event: TrafficEvent) {
  if (typeof window === "undefined") return;

  try {
    const source = getTrafficSource();

    const payload = {
      ...event,

      session_id: getSessionId(),

      page: event.page || window.location.pathname,

      referrer: document.referrer || null,

      source: event.source || source.source,

      medium: event.medium || source.medium,

      campaign: event.campaign || source.campaign,

      user_agent: navigator.userAgent,

      timestamp: new Date().toISOString(),
    };

    await fetch(`${TRAFFIC_API}/track`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),

      keepalive: true,
    });
  } catch (error) {
    // Tracking must NEVER break the AI Vault UI.
    console.debug("[AI Vault Traffic] Tracking failed:", error);
  }
}

export function trackPageView(page?: string) {
  return sendTrafficEvent({
    event: "page_view",
    page,
  });
}

export function trackToolImpression(
  toolSlug: string,
  toolName: string,
  category?: string,
  position?: number
) {
  return sendTrafficEvent({
    event: "tool_impression",
    tool_slug: toolSlug,
    tool_name: toolName,
    category,
    position,
  });
}

export function trackToolClick(
  toolSlug: string,
  toolName: string,
  category?: string,
  position?: number
) {
  return sendTrafficEvent({
    event: "tool_click",
    tool_slug: toolSlug,
    tool_name: toolName,
    category,
    position,
  });
}
