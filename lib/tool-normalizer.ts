export interface FormattedListItem {
  title?: string;
  description: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface PricingDetailsJSON {
  model?: "Free" | "Freemium" | "Paid" | "Open Source" | "Free Trial" | "Contact Sales" | string;
  note?: string;
  official_link?: string;
  plans?: { name: string; price: string; period?: string; features?: string[] }[];
}

export interface DatabaseToolRecord {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  pricing: string | null;
  description: string | null;
  website_url: string | null;
  official_url: string | null;
  affiliate_url: string | null;
  youtube_url: string | null;
  youtube_id: string | null;
  score: number | null;
  neural_score: number | null;
  rating: number | null;
  image_url: string | null;
  logo_url: string | null;
  is_sponsored?: boolean | null;
  created_at?: string | null;
  features_pros: FormattedListItem[] | null;
  limitations_cons: FormattedListItem[] | null;
  who_should_use: string | null;
  how_to_use: string[] | null;
  pricing_details: PricingDetailsJSON | null;
  tags: string[] | null;
  faqs: FAQItem[] | null;
  related_tools?: unknown[] | null;
  seo_title: string | null;
  seo_description: string | null;
  pros_cons?: string | null;
  faq?: string | FAQItem[] | null;
}

export interface NormalizedTool {
  id: string;
  name: string;
  slug: string;
  category: string;
  pricingModel: string;
  pricingDetails: PricingDetailsJSON | null;
  description: string;
  shortDescription: string;
  pros: FormattedListItem[];
  cons: FormattedListItem[];
  whoShouldUse: string | null;
  howToUse: string[];
  faqs: FAQItem[];
  tags: string[];
  editorialScore: number | null;
  officialUrl: string;
  affiliateUrl: string | null;
  youtubeVideoId: string | null;
  seoTitle: string;
  seoDescription: string;
  dataStatus: "Database Verified" | "Database Enriched" | "Partially Enriched";
}
