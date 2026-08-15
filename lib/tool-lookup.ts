import type { Tool } from "./tool-types";
import { normalizeTool, normalizeSlug } from "./normalize-tool";

type Row = Record<string, unknown>;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sameSlug(a: unknown, b: unknown): boolean {
  return normalizeSlug(a) === normalizeSlug(b);
}

function matchesTool(tool: Tool, requested: string): boolean {
  const target = normalizeSlug(safeDecode(requested));

  if (!target) return false;

  // Canonical slug
  if (sameSlug(tool.slug, target)) {
    return true;
  }

  // ID support
  if (
    tool.id !== null &&
    tool.id !== undefined &&
    String(tool.id) === safeDecode(requested)
  ) {
    return true;
  }

  // Name fallback
  if (sameSlug(tool.name, target)) {
    return true;
  }

  return false;
}

export function findTool(
  rows: Row[],
  requestedSlug: string
): Tool | null {
  const normalized = rows.map((row) => normalizeTool(row));

  return (
    normalized.find((tool) =>
      matchesTool(tool, requestedSlug)
    ) ?? null
  );
}

export function findRelatedTools(
  rows: Row[],
  currentTool: Tool,
  limit = 6
): Tool[] {
  const currentCategory = normalizeSlug(currentTool.category);

  return rows
    .map((row) => normalizeTool(row))
    .filter((tool) => {
      if (tool.slug === currentTool.slug) return false;

      return normalizeSlug(tool.category) === currentCategory;
    })
    .slice(0, limit);
}
