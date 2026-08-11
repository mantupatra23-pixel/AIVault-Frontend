import Link from "next/link";
import { ToolLogo } from "@/components/ToolLogo";

export interface ToolCardProps {
  tool: {
    id?: string;
    name: string;
    slug: string;
    category?: string | null;
    pricing?: string | null;
    description?: string | null;
    image_url?: string | null;
    logo_url?: string | null;
    score?: number | null;
    neural_score?: number | null;
    rating?: number | null;
  };
}

export function ToolCard({ tool }: ToolCardProps) {
  // Normalize score to 10-point scale safely
  const rawScore = tool.score || tool.neural_score || tool.rating;
  let formattedScore: string | null = null;
  if (rawScore && rawScore > 0) {
    const numScore = Number(rawScore);
    if (numScore > 10 && numScore <= 100) {
      formattedScore = (numScore / 10).toFixed(1);
    } else if (numScore <= 10) {
      formattedScore = numScore.toFixed(1);
    } else {
      formattedScore = "8.5";
    }
  }

  // Always use the direct database slug for navigation
  const toolSlug = tool.slug ? encodeURIComponent(tool.slug.trim()) : "";

  return (
    <div className="group bg-white border border-slate-100 hover:border-blue-200 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header: Logo, Category & Score */}
        <div className="flex items-start justify-between gap-3">
          <ToolLogo tool={tool} size="md" />

          <div className="flex flex-col items-end gap-1">
            {tool.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                {tool.category}
              </span>
            )}
            {tool.pricing && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {tool.pricing}
              </span>
            )}
          </div>
        </div>

        {/* Content: Title & Short Description */}
        <div>
          <h3 className="text-lg font-bold text-slate-950 group-hover:text-blue-600 transition-colors line-clamp-1 font-serif">
            {tool.name}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {tool.description || `${tool.name} overview and specifications.`}
          </p>
        </div>
      </div>

      {/* Footer: Score Badge & Link Action */}
      <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between text-xs">
        {formattedScore ? (
          <div className="flex items-center gap-1 font-extrabold text-blue-600">
            <span>★</span>
            <span>{formattedScore}</span>
            <span className="text-slate-400 font-normal">/10</span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">
            Verified Tool
          </span>
        )}

        <Link
          href={`/tool/${toolSlug}`}
          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
        >
          <span>FULL REPORT</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
