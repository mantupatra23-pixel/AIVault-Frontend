import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: tool } = await supabase.from('ai_tools').select('*').ilike('slug', slug).single();

  if (!tool) return <div className="p-20 text-center font-black">404 - NOT FOUND</div>;

  const sections = tool.description.split('##').map((sec: string) => sec.trim()).filter(Boolean);

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <div className="h-2 bg-blue-600 sticky top-0 z-50"></div>
      <article className="max-w-3xl mx-auto px-6 py-20">
        <nav className="mb-20">
          <Link href="/" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2">
            ← Back to Directory
          </Link>
        </nav>

        <header className="mb-24">
          <div className="flex items-center gap-3 mb-6 font-black text-[10px] uppercase tracking-widest">
            <span className="bg-black text-white px-2 py-0.5 rounded-sm">{tool.category}</span>
            <span className="text-gray-300 italic">Verified Review</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-gray-900 tracking-[-0.06em] leading-[0.8] mb-12">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>
        </header>

        <div className="space-y-24">
          {sections.map((section: string, idx: number) => {
            const lines = section.split('\n');
            const title = lines[0].replace(/\*\*/g, '').replace(/\*/g, '').trim();
            const body = lines.slice(1).join('\n').trim();

            // CLEANED CONTENT Rendering
            const cleanedBody = body.replace(/\*\*/g, '').replace(/\*/g, '•');

            return (
              <section key={idx} className="border-t border-gray-100 pt-12">
                {section.includes('##') || idx > 0 ? (
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">{title}</h2>
                ) : null}
                <div className="text-xl leading-[1.8] text-gray-600 whitespace-pre-wrap font-medium">
                  {idx === 0 ? section.replace(/\*\*/g, '').replace(/\*/g, '•') : cleanedBody}
                </div>
              </section>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-32 p-12 md:p-24 bg-gray-900 rounded-[4rem] text-center shadow-2xl">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-none">Execute now.</h2>
          <a href={tool.website_url} target="_blank" className="inline-block bg-blue-600 text-white px-16 py-6 rounded-2xl font-black text-xl hover:scale-105 transition-all">
            Visit {tool.name} ↗
          </a>
        </div>
      </article>
    </div>
  )
}
