export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://aivault.pp.ua";

export function getToolUrl(slug: string): string {
  const cleanSlug = encodeURIComponent(slug.trim());
  return `${SITE_URL}/tool/${cleanSlug}`;
}
