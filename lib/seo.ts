export const SITE_URL = "https://www.aivault.pp.ua";

export const SITE_NAME = "AI Vault";

export const DEFAULT_DESCRIPTION =
  "Discover, compare and find the best AI tools for every use case. Explore verified AI tools, AI stacks, comparisons and intelligent recommendations.";

export function absoluteUrl(path = "/") {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return `${SITE_URL}${path}`;
}

export function createToolCanonical(slug: string) {
  return absoluteUrl(`/tools/${slug}`);
}

export function createCategoryCanonical(slug: string) {
  return absoluteUrl(`/categories/${slug}`);
}

export function createUseCaseCanonical(slug: string) {
  return absoluteUrl(`/use-cases/${slug}`);
}

export function createCompareCanonical(slugs: string[]) {
  return absoluteUrl(`/compare/${slugs.join("-vs-")}`);
}
