export interface ToolLogoInput {
  name?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  image?: string | null;
  icon_url?: string | null;
  website_url?: string | null;
}

export function resolveToolLogo(tool: ToolLogoInput): string | null {
  if (!tool) return null;

  // Primary image fields check in order of database priority
  const candidate =
    tool.image_url ||
    tool.logo_url ||
    tool.logo ||
    tool.image ||
    tool.icon_url ||
    null;

  if (!candidate || typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();

  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return null;
  }

  // Handle local assets
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Valid URL check
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}
