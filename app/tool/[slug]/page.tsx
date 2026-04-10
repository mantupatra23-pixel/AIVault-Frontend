import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('*')
    .ilike('slug', slug)
    .single();

  if (!tool) {
    return (
      <div className="flex items-center justify-center min-h-screen font-black text-2xl uppercase tracking-tighter">
        Tool Not Found
      </div>
    );
  }

  // CONTENT PARSING LOGIC: Split by ## to create beautiful sections
  const sections = tool.description.split('##').map((sec: string) => sec.trim()).filter(Boolean);

  return (
    <div className="bg-[#fcfcfc] min-h-screen selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Professional Accent */}
      <div className="h-2 bg-blue-600 sticky top-0 z-50"></div>

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-28">
        {/* Minimalist Nav */}
        <nav className="mb-20">
          <Link href="/" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] hover:opacity-50 transition-all flex items-center gap-2">
            ← Back to Directory
          </Link>
        </nav>

        {/* Hero Section: The "Wow" Factor */}
        <header className="mb-24">
          <div className="flex items-center gap-3 mb-8">
            <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase">
              {tool.category}
            </span>
            <div className="w-12 h-[1px] bg-gray-200"></div>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] italic">AIVault Editorial</span>
          </div>

          <h1 className="text-7xl md:text-[9rem] font-black text-gray-900 tracking-[-0.06em] leading-[0.8] mb-12">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          <p className="text-2xl md:text-3xl text-gray-400 font-medium leading-tight max-w-xl">
            A high-performance analysis of {tool.name}'s ecosystem and impact on the AI industry.
          </p>
        </header>

        {/* Dynamic Section Rendering */}
        <div className="space-y-24">
          {sections.map((section: string, idx: number) => {
            // First section is usually the intro review
            if (idx === 0 && !tool.description.startsWith('##')) {
              return (
                <div key={idx} className="text-xl leading-[1.8] text-gray-600 space-y-6">
                  {section.split('\n').map((p, i) => p && <p key={i}>{p}</p>)}
                </div>
              );
            }

            // Split title and body for ## sections
            const lines = section.split('\n');
            const title = lines[0].replace(/\*/g, '').trim();
            const body = lines.slice(1).join('\n').trim();

            return (
              <section key={idx} className="relative pt-12 border-t border-gray-100">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-10 uppercase leading-none">
                  {title}
                </h2>
                <div className="text-lg md:text-xl leading-[1.9] text-gray-600 whitespace-pre-wrap">
                  {/* Convert * to proper bullet points visually */}
                  {body.replace(/\*/g, '•')}
                </div>
              </section>
            );
          })}
        </div>

        {/* High-Value CTA Section */}
        <section className="mt-40">
          <div className="bg-gray-900 rounded-[4rem] p-12 md:p-28 text-center relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px]"></div>
             
             <h2 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-none">
               Execute with <br/> {tool.name}
             </h2>
             
             <a 
               href={tool.website_url} 
               target="_blank"
               rel="noopener noreferrer"
               className="inline-block bg-blue-600 text-white px-16 py-6 rounded-2xl font-black text-xl hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
             >
               Visit Official Website ↗
             </a>
          </div>
        </section>

        {/* Premium Minimal Footer */}
        <footer className="mt-40 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
            AI VAULT ENGINE • PRODUCTION 2026
          </div>
          <div className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">
            Handcrafted for 10Cr+ Global Traffic
          </div>
        </footer>
      </article>
    </div>
  )
}
