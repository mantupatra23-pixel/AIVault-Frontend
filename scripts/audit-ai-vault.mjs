import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing Supabase environment variables."
  );
}

const supabase = createClient(
  url,
  key
);

const GENERIC_PATTERNS = [
  "senior seo",
  "visora ai",
  "professional review",
  "our analysis reveals",
  "ever-evolving landscape",
  "cutting-edge",
  "powerful features",
  "user-friendly interface",
  "excellent option",
  "streamline workflows",
  "enhance overall efficiency",
  "valuable tool",
  "robust tool",
  "wide range of users",
  "make informed decisions",
  "designed to help users",
  "pricing 2026",
];

function text(value) {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value)
      .trim();
  }

  return "";
}

function normalize(value) {
  return text(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(
    normalize(value)
      .replace(
        /[^a-z0-9\s]/g,
        " "
      )
      .split(/\s+/)
      .filter(
        (x) => x.length > 2
      )
  );
}

function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let intersection = 0;

  for (const value of A) {
    if (B.has(value)) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...A,
      ...B,
    ]).size;

  return intersection / union;
}

const { data, error } =
  await supabase
    .from("ai_tools")
    .select(`
      id,
      name,
      slug,
      description,
      short_description,
      overview,
      category,
      pricing,
      pricing_model,
      features,
      key_features,
      use_cases,
      integrations,
      limitations,
      cons,
      operating_system,
      os,
      deployment,
      license,
      rating,
      score,
      ai_vault_score,
      website_url
    `)
    .order("name");

if (error) {
  throw new Error(error.message);
}

const tools = data || [];

const missing = {
  description: [],
  category: [],
  pricing: [],
  features: [],
  useCases: [],
  integrations: [],
  website: [],
  slug: [],
};

const generic = [];
const suspiciousScores = [];
const invalidSlugs = [];

for (const tool of tools) {
  const description =
    text(tool.description) ||
    text(tool.short_description) ||
    text(tool.overview);

  if (!description) {
    missing.description.push(tool);
  }

  if (!text(tool.category)) {
    missing.category.push(tool);
  }

  if (
    !text(tool.pricing) &&
    !text(tool.pricing_model)
  ) {
    missing.pricing.push(tool);
  }

  if (
    !Array.isArray(tool.features) &&
    !Array.isArray(tool.key_features) &&
    !text(tool.features) &&
    !text(tool.key_features)
  ) {
    missing.features.push(tool);
  }

  if (
    !Array.isArray(tool.use_cases) &&
    !text(tool.use_cases)
  ) {
    missing.useCases.push(tool);
  }

  if (
    !Array.isArray(tool.integrations) &&
    !text(tool.integrations)
  ) {
    missing.integrations.push(tool);
  }

  if (!text(tool.website_url)) {
    missing.website.push(tool);
  }

  const slug =
    text(tool.slug);

  if (
    !slug ||
    slug !== slug.trim() ||
    slug.includes(" ") ||
    slug.includes("/") ||
    slug !== slug.toLowerCase()
  ) {
    invalidSlugs.push({
      id: tool.id,
      name: tool.name,
      slug,
    });
  }

  const genericHits =
    GENERIC_PATTERNS.filter(
      (pattern) =>
        normalize(
          description
        ).includes(pattern)
    );

  if (genericHits.length) {
    generic.push({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      hits: genericHits,
    });
  }

  const score =
    Number(
      tool.ai_vault_score ??
        tool.score
    );

  if (
    Number.isFinite(score) &&
    (score < 0 ||
      score > 100)
  ) {
    suspiciousScores.push({
      id: tool.id,
      name: tool.name,
      score,
    });
  }
}

/* =========================================================
   DUPLICATES
========================================================= */

const exactGroups = new Map();

for (const tool of tools) {
  const description =
    normalize(
      text(tool.description)
    );

  if (!description) continue;

  if (!exactGroups.has(description)) {
    exactGroups.set(
      description,
      []
    );
  }

  exactGroups
    .get(description)
    .push(tool);
}

const exactDuplicates =
  Array.from(
    exactGroups.values()
  ).filter(
    (group) =>
      group.length > 1
  );

const nearDuplicates = [];

for (
  let i = 0;
  i < tools.length;
  i++
) {
  const a = tools[i];

  const aText =
    text(a.description);

  if (!aText) continue;

  for (
    let j = i + 1;
    j < tools.length;
    j++
  ) {
    const b = tools[j];

    const bText =
      text(b.description);

    if (!bText) continue;

    const similarity =
      jaccard(
        aText,
        bText
      );

    if (
      similarity >= 0.85
    ) {
      nearDuplicates.push({
        a: {
          id: a.id,
          name: a.name,
          slug: a.slug,
        },
        b: {
          id: b.id,
          name: b.name,
          slug: b.slug,
        },
        similarity:
          Number(
            similarity.toFixed(3)
          ),
      });
    }
  }
}

/* =========================================================
   REPORT
========================================================= */

console.log("");
console.log(
  "=========================================="
);
console.log(
  "AI VAULT 3.1 CONTENT QUALITY AUDIT"
);
console.log(
  "=========================================="
);

console.log(
  `TOTAL TOOLS: ${tools.length}`
);

console.log("");
console.log("CONTENT");
console.log(
  `Missing descriptions: ${missing.description.length}`
);
console.log(
  `Generic descriptions: ${generic.length}`
);
console.log(
  `Exact duplicate groups: ${exactDuplicates.length}`
);
console.log(
  `Near duplicate pairs: ${nearDuplicates.length}`
);

console.log("");
console.log("METADATA");
console.log(
  `Missing categories: ${missing.category.length}`
);
console.log(
  `Missing pricing: ${missing.pricing.length}`
);
console.log(
  `Missing features: ${missing.features.length}`
);
console.log(
  `Missing use cases: ${missing.useCases.length}`
);
console.log(
  `Missing integrations: ${missing.integrations.length}`
);
console.log(
  `Missing official URLs: ${missing.website.length}`
);
console.log(
  `Invalid slugs: ${invalidSlugs.length}`
);
console.log(
  `Suspicious scores: ${suspiciousScores.length}`
);

console.log("");
console.log("VISORA / GENERIC TEMPLATE");

for (const item of generic.slice(0, 100)) {
  console.log(
    `- ${item.name} (${item.slug})`
  );
  console.log(
    `  ${item.hits.join(", ")}`
  );
}

console.log("");
console.log("INVALID SLUGS");

for (const item of invalidSlugs) {
  console.log(
    `- ${item.name} => "${item.slug}"`
  );
}

console.log("");
console.log("EXACT DUPLICATES");

for (const group of exactDuplicates) {
  console.log(
    `GROUP: ${group.length}`
  );

  for (const item of group) {
    console.log(
      `  - ${item.name} (${item.slug})`
    );
  }
}

console.log("");
console.log("NEAR DUPLICATES");

for (
  const pair of nearDuplicates.slice(
    0,
    100
  )
) {
  console.log(
    `${pair.similarity} :: ${pair.a.name} <> ${pair.b.name}`
  );
}

console.log("");
console.log(
  "=========================================="
);
console.log("AUDIT COMPLETE");
console.log(
  "NO DATABASE RECORDS WERE MODIFIED."
);
console.log(
  "=========================================="
);
