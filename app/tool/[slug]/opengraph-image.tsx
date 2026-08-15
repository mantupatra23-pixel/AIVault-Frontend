// app/tool/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { getToolScore } from "@/lib/score";

export const runtime = "nodejs";
export const alt = "AI Vault Tool Intelligence Dossier";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || "");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: tool } = await supabase
    .from("ai_tools")
    .select("name, category, pricing, pricing_model, score, neural_score, ai_vault_score")
    .or(`slug.eq.${rawSlug},name.ilike.${rawSlug}`)
    .limit(1)
    .maybeSingle();

  const name = String(tool?.name || "AI Tool");
  const category = String(tool?.category || "AI Software");
  const pricing = String(tool?.pricing_model || tool?.pricing || "Verified");
  const score = getToolScore(tool) ?? 90;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050714",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
              }}
            />
            <span style={{ fontSize: "32px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.04em" }}>
              AI Vault<span style={{ color: "#3b82f6" }}>.</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              borderRadius: "999px",
              padding: "8px 24px",
              color: "#93c5fd",
              fontSize: "16px",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            Verified AI Intelligence
          </div>
        </div>

        {/* Center Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span
              style={{
                backgroundColor: "#1e293b",
                color: "#94a3b8",
                fontSize: "18px",
                fontWeight: "700",
                padding: "6px 18px",
                borderRadius: "999px",
                textTransform: "capitalize",
              }}
            >
              {category}
            </span>
            <span
              style={{
                backgroundColor: "#1e293b",
                color: "#94a3b8",
                fontSize: "18px",
                fontWeight: "700",
                padding: "6px 18px",
                borderRadius: "999px",
              }}
            >
              {pricing}
            </span>
          </div>

          <h1
            style={{
              fontSize: "64px",
              fontWeight: "900",
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: "1.1",
              margin: 0,
            }}
          >
            {name}
          </h1>

          <p
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: "1.4",
              maxWidth: "850px",
              margin: 0,
            }}
          >
            Explore verified capabilities, workflow pricing, and comparative benchmarks on AI Vault.
          </p>
        </div>

        {/* Bottom Score Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "18px", color: "#64748b", fontWeight: "600" }}>
            https://aivault.pp.ua
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>
              AI Vault Score:
            </span>
            <span style={{ fontSize: "36px", fontWeight: "900", color: "#3b82f6" }}>
              {score}/100
            </span>
          </div>
        </div>
      </div>
    )
  );
}
