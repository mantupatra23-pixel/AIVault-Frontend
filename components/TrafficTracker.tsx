"use client";

import { useEffect, useRef } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

type TrafficTrackerProps = {
  page?: string;
  query?: string;
};

export default function TrafficTracker({
  page,
  query,
}: TrafficTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;

    const track = async () => {
      try {
        if (!API_URL) {
          console.warn(
            "[AI VAULT TRAFFIC] NEXT_PUBLIC_API_URL is not configured"
          );
          return;
        }

        const currentPage =
          page ||
          (typeof window !== "undefined"
            ? window.location.pathname
            : "/");

        const currentQuery =
          query ||
          (typeof window !== "undefined"
            ? new URLSearchParams(
                window.location.search
              ).get("q") || ""
            : "");

        const payload = {
          query: currentQuery,
          page: currentPage,
        };

        const controller =
          new AbortController();

        const timeout = window.setTimeout(
          () => controller.abort(),
          5000
        );

        try {
          const response = await fetch(
            `${API_URL}/api/traffic/track`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),

              signal: controller.signal,

              credentials: "omit",

              cache: "no-store",

              keepalive: true,
            }
          );

          if (!response.ok) {
            console.warn(
              `[AI VAULT TRAFFIC] Tracking failed: ${response.status}`
            );

            return;
          }

          if (
            process.env.NODE_ENV ===
            "development"
          ) {
            console.log(
              "[AI VAULT TRAFFIC] tracked",
              payload
            );
          }
        } finally {
          window.clearTimeout(timeout);
        }
      } catch (error) {
        /*
         * Analytics must NEVER break
         * the main application.
         */
        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.warn(
            "[AI VAULT TRAFFIC] Tracking skipped",
            error
          );
        }
      }
    };

    /*
     * Delay slightly so traffic tracking
     * never blocks initial page rendering.
     */
    const timer = window.setTimeout(
      track,
      250
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [page, query]);

  return null;
}
