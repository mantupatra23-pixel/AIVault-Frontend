"use client";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_TRAFFIC_ENGINE_URL ||
  "https://aivault-faqc.onrender.com";

const SESSION_KEY = "aivault_traffic_session";

type TrafficEvent = {
  event: "page_view" | "tool_impression" | "tool_click";

  page?: string;

  tool_slug?: string;

  tool_name?: string;

  category?: string;

  position?: number;

  referrer?: string | null;

  source?: string;

  medium?: string;

  campaign?: string;
};

function getBackendOrigin(): string {
  let value = String(BACKEND_ORIGIN || "").trim();

  value = value.replace(/\/+$/, "");

  /*
   * Accept old environment values safely.
   *
   * Examples:
   *
   * https://aivault-faqc.onrender.com
   * https://aivault-faqc.onrender.com/
   * https://aivault-faqc.onrender.com/api
   * https://aivault-faqc.onrender.com/api/traffic
   * https://aivault-faqc.onrender.com/api/traffic-engine
   *
   * Internally we always normalize to:
   *
   * https://aivault-faqc.onrender.com
   */

  value = value.replace(
    /\/api\/traffic-engine$/i,
    "",
  );

  value = value.replace(
    /\/api\/traffic$/i,
    "",
  );

  value = value.replace(
    /\/api$/i,
    "",
  );

  value = value.replace(/\/+$/, "");

  return value;
}

const TRAFFIC_ENDPOINT =
  `${getBackendOrigin()}/api/traffic/track`;

function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    let session =
      window.sessionStorage.getItem(
        SESSION_KEY,
      );

    if (!session) {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        session = crypto.randomUUID();
      } else {
        session =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;
      }

      window.sessionStorage.setItem(
        SESSION_KEY,
        session,
      );
    }

    return session;
  } catch {
    return "";
  }
}

function getTrafficSource(): {
  source: string;
  medium: string;
  campaign: string;
} {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      medium: "none",
      campaign: "",
    };
  }

  try {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const utmSource =
      params.get("utm_source") || "";

    const utmMedium =
      params.get("utm_medium") || "";

    const utmCampaign =
      params.get("utm_campaign") || "";

    let source = utmSource;

    let medium = utmMedium;

    if (!source) {
      const referrer =
        document.referrer;

      if (!referrer) {
        source = "direct";
        medium = "none";
      } else {
        try {
          source =
            new URL(referrer).hostname;

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
      campaign: utmCampaign,
    };
  } catch {
    return {
      source: "direct",
      medium: "none",
      campaign: "",
    };
  }
}

function getCurrentPage(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return (
    window.location.pathname ||
    "/"
  );
}

async function sendTrafficEvent(
  event: TrafficEvent,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const source =
      getTrafficSource();

    const payload = {
      ...event,

      session_id:
        getSessionId(),

      page:
        event.page ||
        getCurrentPage(),

      referrer:
        event.referrer ??
        document.referrer ??
        null,

      source:
        event.source ||
        source.source,

      medium:
        event.medium ||
        source.medium,

      campaign:
        event.campaign ||
        source.campaign,

      user_agent:
        navigator.userAgent,

      timestamp:
        new Date().toISOString(),
    };

    const response =
      await fetch(
        TRAFFIC_ENDPOINT,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(payload),

          keepalive: true,

          credentials: "omit",
        },
      );

    /*
     * Traffic tracking must never
     * break the AI Vault UI.
     */

    if (!response.ok) {
      console.debug(
        "[AI Vault Traffic] Tracking request failed:",
        response.status,
        TRAFFIC_ENDPOINT,
      );
    }
  } catch (error) {
    console.debug(
      "[AI Vault Traffic] Tracking failed:",
      error,
    );
  }
}

export function trackPageView(
  page?: string,
): Promise<void> {
  return sendTrafficEvent({
    event: "page_view",

    page:
      page ||
      getCurrentPage(),
  });
}

export function trackToolImpression(
  toolSlug: string,
  toolName: string,
  category?: string,
  position?: number,
): Promise<void> {
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
  position?: number,
): Promise<void> {
  return sendTrafficEvent({
    event: "tool_click",

    tool_slug: toolSlug,

    tool_name: toolName,

    category,

    position,
  });
}
