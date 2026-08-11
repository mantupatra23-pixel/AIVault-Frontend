/**
 * Static tool fallback list to ensure /sitemap.xml never fails for Googlebot
 * even if database or API calls time out during build or execution.
 */
export const FALLBACK_TOOL_SLUGS: string[] = [
  "liso",
  "ghost",
  "freesolo-flash",
  "hotspot-meter",
  "fedica-2",
  "prosed",
  "pushary",
  "fluree-ai",
  "reignat",
  "harnessrouter",
  "kodhau",
  "photobomb",
  "bitfield",
  "benchmark",
  "nylas-cli",
  "diffsmith",
  "molmoact-2",
];
