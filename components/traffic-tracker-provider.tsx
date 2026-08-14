"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { trackPageView } from "@/lib/traffic-tracker";

export default function TrafficTrackerProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    trackPageView(pathname);
  }, [pathname]);

  return null;
}
