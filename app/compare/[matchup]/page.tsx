import { redirect } from "next/navigation";
import { Metadata } from "next";

type Props = {
  params: Promise<{ matchup: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchup } = await params;
  const parts = matchup.split("-vs-");
  const tool1 = parts[0]?.replace(/-/g, " ").toUpperCase() || "TOOL 1";
  const tool2 = parts[1]?.replace(/-/g, " ").toUpperCase() || "TOOL 2";

  return {
    title: `${tool1} vs ${tool2} – Detailed Head-to-Head AI Comparison & Benchmarks (2026)`,
    description: `Compare ${tool1} and ${tool2} specifications, pricing models, verified performance benchmarks, and feature capabilities on AI Vault.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/compare/${matchup}`,
    },
  };
}

export default async function MatchupPage({ params }: Props) {
  const { matchup } = await params;
  const parts = matchup.split("-vs-");

  if (parts.length >= 2) {
    redirect(`/compare?tools=${encodeURIComponent(parts[0])},${encodeURIComponent(parts[1])}`);
  }

  redirect("/compare");
}
