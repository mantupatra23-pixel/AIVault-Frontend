import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface ToolIndexItem {
  name: string;
  slug: string;
}

async function getFooterTools(): Promise<ToolIndexItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("ai_tools")
      .select("name, slug")
      .eq("is_published", true)
      .not("slug", "is", null)
      .limit(24);

    if (error || !data) {
      return [];
    }

    return data.filter(
      (tool): tool is ToolIndexItem =>
        Boolean(tool.slug && typeof tool.slug === "string" && tool.slug.trim() !== "")
    );
  } catch {
    return [];
  }
}

export default async function FooterIndex() {
  const tools = await getFooterTools();

  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
          Neural Index // Direct Access
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tool/${tool.slug}`}
              className="hover:text-blue-400 transition-colors"
            >
              {tool.name}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
