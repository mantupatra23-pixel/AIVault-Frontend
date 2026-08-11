export interface FormattedListItem {
  title?: string;
  description: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface PricingDetailsJSON {
  model?: string;
  note?: string;
  official_link?: string;
  plans?: { name: string; price: string; period?: string; features?: string[] }[];
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
