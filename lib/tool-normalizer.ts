export interface FormattedListItem {
  title?: string;
  description: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface DatabaseToolRecord {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  description?: string | null;
  pricing?: string | null;
  pricing_details?: unknown;
  pricingDetails?: unknown;
  website_url?: string | null;
  websiteUrl?: string | null;
  affiliate_url?: string | null;
  affiliateUrl?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  youtube_id?: string | null;
  youtubeId?: string | null;
  score?: number | null;
  rating?: number | null;
  features_pros?: FormattedListItem[] | null;
  featuresPros?: FormattedListItem[] | null;
  limitations_cons?: FormattedListItem[] | null;
  limitationsCons?: FormattedListItem[] | null;
  pros_cons?: unknown;
  prosCons?: unknown;
  who_should_use?: string | string[] | null;
  whoShouldUse?: string | string[] | null;
  how_to_use?: string[] | null;
  howToUse?: string[] | null;
  tags?: string[] | null;
  faqs?: FAQItem[] | null;
  seo_title?: string | null;
  seoTitle?: string | null;
  seo_description?: string | null;
  seoDescription?: string | null;
  created_at?: string;
  createdAt?: string;
}

export type NormalizedTool = DatabaseToolRecord;
