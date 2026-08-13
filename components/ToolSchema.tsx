function ToolSchema({ tool }: { tool: any }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",

    name: tool.name,

    description:
      tool.description ||
      tool.seo_description ||
      `Discover ${tool.name} on AI Vault.`,

    url: tool.website_url,

    applicationCategory:
      tool.category || "Artificial Intelligence",

    operatingSystem:
      Array.isArray(tool.platforms)
        ? tool.platforms.join(", ")
        : "Web",

    image: tool.logo || undefined,

    aggregateRating:
      tool.rating && tool.review_count
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(tool.rating),
            reviewCount: Number(tool.review_count),
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,

    offers:
      tool.pricing_starting
        ? {
            "@type": "Offer",
            price: Number(tool.pricing_starting),
            priceCurrency: tool.currency || "USD",
            url: tool.website_url,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

export default ToolSchema;
