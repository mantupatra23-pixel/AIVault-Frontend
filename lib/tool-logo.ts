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

  // Extract candidate URL from possible database column names
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

  // Reject empty, undefined strings, or malformed values
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return null;
  }

  // Allow relative public assets
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Validate HTTPS/HTTP URLs
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    // Malformed URL string
    return null;
  }

  return null;
}
