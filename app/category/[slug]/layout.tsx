import type { Metadata } from "next";

const SITE_URL = "https://aivault.pp.ua";

function cleanCategory(value: string): string {
  return decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function categorySlug(value: string): string {
  return decodeURIComponent(value)
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const category = cleanCategory(slug);
  const normalizedSlug = categorySlug(slug);

  const title = `Best ${category} AI Tools`;
  const description = `Explore verified ${category} AI tools, software platforms, features, pricing, use cases, reviews, and alternatives on AI Vault.`;

  const canonical = `${SITE_URL}/category/${normalizedSlug}`;

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "website",
      siteName: "AI Vault",
      url: canonical,
      title,
      description,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = cleanCategory(slug);
  const normalizedSlug = categorySlug(slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${category} AI Tools`,
    description: `Explore verified ${category} AI tools on AI Vault.`,
    url: `${SITE_URL}/category/${normalizedSlug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "AI Vault",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {children}
    </>
  );
}
