import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: tool } = await supabase.from('ai_tools').select('name, category').ilike('slug', slug).single();
  
  return {
    title: `${tool?.name || 'AI Tool'} Review | AIVault by Mantu Patra`,
    description: `Expert analysis of ${tool?.name}. Explore features, pros, cons, and use-cases for this ${tool?.category} AI tool curated by Mantu Patra.`,
  }
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: tool } = await supabase.from('ai_tools').select('*').ilike('slug', slug).single();

  if (!tool) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-tighter text-gray-300">
      Tool Not Found
    </div>
  );

  const sections: string[] = tool.description.split('##').map((sec: string) => sec.trim()).filter(Boolean);

  // FAQ Schema Fix (TypeScript error solved here)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": sections.filter((s: string) => s.toUpperCase().includes("QUESTION")).map((s: string) => {
        const [q, ...a] = s.split('\n');
        return {
            "@type": "Question",
            "name": q.replace(/\*/g, '').trim(),
            "acceptedAnswer": { "@type": "Answer", "text": a.join(' ').replace(/\*/g, '').trim() }
        }
    })
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans selection:bg-blue-600 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div className="h-1.5 bg-blue-600 sticky top-0 z-[110]"></div>

      <article className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <nav className="mb-16">
          <Link href="/" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2 hover:opacity-50 transition-all">
            ← Back to Directory
          </Link>
        </nav>

        <header className="mb-24 border-b border-gray-100 pb-16 grid grid-cols-1 md:grid-cols-[160px,1fr] gap-12 items-center">
          <div className="w-40 h-40 bg-white rounded-[2.5rem] border border-gray-100 flex items-center justify-center relative shadow-2xl shadow-blue-100/20">
             <div className="text-[10px] font-black text-gray-200 uppercase tracking-widest text-center px-4">
               {tool.name.charAt(0)}
             </div>
          </div>

          <div>
             <div className="flex items-center gap-3 mb-6 font-black text-[10px] uppercase tracking-widest">
                <span className="bg-black text-white px-2 py-0.5 rounded-sm">{tool.category}</span>
                <span className="text-gray-300 italic">Verified Technical Review</span>
             </div>
             <h1 className="text-7xl md:text-9xl font-black text-gray-900 tracking-[-0.06em] leading-[0.8]">
               {tool.name}<span className="text-blue-600">.</span>
             </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-20">
          <div className="space-y-20">
            {sections.map((section: string, idx: number) => {
              const lines = section.split('\n');
              const rawTitle = lines[0].replace(/\*/g, '').trim();
              const isIntro = idx === 0 && !section.startsWith('##');
              
              const isSidebarItem = ["PROS", "CONS", "FAQ", "QUESTIONS"].some(k => rawTitle.toUpperCase().includes(k));
              if (isSidebarItem && !isIntro) return null;

              const body = isIntro ? section : lines.slice(1).join('\n');
              const cleanedBody = body.replace(/\*\*/g, '').replace(/\*/g, '•').trim();

              return (
                <section key={idx} className={isIntro ? "border-l-4 border-blue-600 pl-8" : ""}>
                  {!isIntro && (
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-10 uppercase italic">
                      {rawTitle}
                    </h2>
                  )}
                  <div className={`text-xl leading-[1.9] text-gray-600 whitespace-pre-wrap font-medium ${isIntro ? 'text-2xl text-gray-900 font-bold' : ''}`}>
                    {cleanedBody}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="space-y-8">
            {sections.map((section: string, idx: number) => {
              const lines = section.split('\n');
              const rawTitle = lines[0].replace(/\*/g, '').trim();
              const body = lines.slice(1).join('\n').trim();
              const cleanedBody = body.replace(/\*\*/g, '').replace(/\*/g, '•').trim();

              const isPros = rawTitle.toUpperCase().includes("PROS");
              const isCons = rawTitle.toUpperCase().includes("CONS");
              const isFaq = rawTitle.toUpperCase().includes("FAQ") || rawTitle.toUpperCase().includes("QUESTION");

              if (!isPros && !isCons && !isFaq) return null;

              return (
                <div key={idx} className={`p-10 rounded-[3rem] border transition-all hover:shadow-xl ${
                  isPros ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 
                  isCons ? 'bg-red-50/50 border-red-100 text-red-900' : 
                  'bg-white border-gray-100 text-gray-600 shadow-sm'
                }`}>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 underline decoration-2 underline-offset-8">
                    {rawTitle}
                  </h3>
                  <div className="text-lg leading-relaxed whitespace-pre-wrap font-semibold">
                    {cleanedBody}
                  </div>
                </div>
              );
            })}
          </aside>
        </div>

        <div className="mt-40 p-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[4rem] shadow-2xl shadow-blue-200">
          <div className="bg-white p-16 md:p-32 rounded-[3.9rem] text-center overflow-hidden relative">
            <h2 className="text-6xl md:text-8xl font-black text-gray-900 mb-12 tracking-tighter leading-none">
              Deploy <br/> {tool.name}.
            </h2>
            <a 
              href={tool.website_url} 
              target="_blank" 
              className="inline-block bg-blue-600 text-white px-20 py-8 rounded-2xl font-black text-2xl hover:bg-black transition-all transform hover:scale-105"
            >
              Visit Official Site ↗
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}
