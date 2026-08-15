import type { Tool } from "./tool-types";
import { normalizeSlug } from "./normalize-tool";

export function getToolSlug(tool: Tool): string {
  const slug = normalizeSlug(tool.slug);

  if (slug) {
    return slug;
  }

  return normalizeSlug(tool.name);
}

export function getToolHref(tool: Tool): string {
  return `/tool/${encodeURIComponent(getToolSlug(tool))}`;
}
