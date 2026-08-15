export type Tool = {
  id?: string | number | null;

  name: string;

  slug?: string | null;

  description?: string | null;
  overview?: string | null;

  category?: string | null;

  pricing?: string | null;
  pricing_model?: string | null;

  website?: string | null;
  official_website?: string | null;
  url?: string | null;

  logo?: string | null;
  logo_url?: string | null;
  image?: string | null;
  image_url?: string | null;

  score?: number | string | null;
  neural_score?: number | string | null;
  rating?: number | string | null;

  contentQualityScore?: number | string | null;
  content_quality_score?: number | string | null;

  platforms?: string[] | string | null;
  deployment?: string | null;
  license?: string | null;

  features?: string[] | string | null;
  use_cases?: string[] | string | null;
  integrations?: string[] | string | null;
  limitations?: string[] | string | null;

  [key: string]: unknown;
};
