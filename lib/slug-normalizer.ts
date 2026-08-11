/**
 * Safely normalizes, decodes, and sanitizes slug strings for database queries and URL routing.
 */
export function normalizeSlug(rawSlug: string): string {
  if (!rawSlug || typeof rawSlug !== "string") return "";

  try {
    // 1. Decode URI component safely
    let decoded = decodeURIComponent(rawSlug).trim();

    // 2. Convert to lowercase
    decoded = decoded.toLowerCase();

    // 3. Remove unsafe URI characters and collapse repeated dashes/spaces
    decoded = decoded
      .replace(/[\s_]+/g, "-") // Convert spaces & underscores to dashes
      .replace(/[^\w\-]+/g, "") // Remove non-alphanumeric/non-dash characters
      .replace(/\-+/g, "-") // Collapse multiple dashes
      .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes

    return decoded;
  } catch {
    return rawSlug.toLowerCase().trim();
  }
}
