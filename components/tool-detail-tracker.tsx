"use client";

import { useEffect } from "react";

import {
  trackToolImpression,
} from "@/lib/traffic-tracker";

type Props = {
  slug: string;
  name: string;
  category?: string;
};

export default function ToolDetailTracker({
  slug,
  name,
  category,
}: Props) {
  useEffect(() => {
    if (!slug || !name) return;

    trackToolImpression(
      slug,
      name,
      category
    );
  }, [slug, name, category]);

  return null;
}
