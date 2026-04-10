import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data: tool } = await supabase.from('ai_tools').select('name').ilike('slug', slug).single();
    return { title: `${tool?.name || 'AI Tool'} Review | AIVault` };
  } catch (e) { return { title: 'AIVault Review' }; }
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: tool, error } = await supabase.from('ai_tools').select('*').ilike('slug', slug).single();

  if (error || !tool) notFound();

  const sections: string[] = tool.description ? tool.description.split('##').map((sec: string) => sec.trim()).filter(Boolean) : [];

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans selection:bg-blue-600 selection:text-white">
      <div className="h-1.5 bg-blue-600 sticky top-0 z-[110]"></div>

      <article className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <nav className="mb-16 text-[10px] font-black uppercase tracking-[0.3em]">
          <Link href="/" className="text-blue-600 hover:opacity-50">← Back to Directory</Link>
        </nav>

        {/* Hero Section */}
        <header className="mb-24 border-b border-gray-100 pb-16 grid grid-cols-1 md:grid-cols-[160px,1fr] gap-12 items-center text-center md:text-left">
          <div className="w-40 h-40 bg-white rounded-[2.5rem] border border-gray-100 mx-auto flex items-center justify-center relative shadow-2xl shadow-blue-100/20 overflow-hidden">
             {tool.image_url ? (
               <img src={tool.image_url} alt={tool.name} className="w-full h-full object-contain p-6" />
             ) : (
               <div className="text-4xl font-black text-blue-600 opacity-20 uppercase">{tool.name.charAt(0)}</div>
             )}
          </div>
          <div>
             <div className="flex items-center justify-center md:justify-start gap-3 mb-6 font-black text-[10px] uppercase tracking-widest">
                <span className="bg-black text-white px-2 py-0.5 rounded-sm">{tool.category}</span>
                <span className="text-gray-300 italic">Mantu Patra Verified Review</span>
             </div>
             <h1 className="text-6xl md:text-9xl font-black text-gray-900 tracking-[-0.06em] leading-[0.8]">
               {tool.name}<span className="text-blue-600">.</span>
             </h1>
          </div>
        </header>

        {/* --- MAGAZINE GRID START --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-20">
          
          {/* LEFT COLUMN: Main Review Content */}
          <div className="space-y-20">
            {sections.map((section: string, idx: number) => {
              const lines = section.split('\n');
              const rawTitle = lines[0].replace(/\*/g, '').trim();
              const isIntro = idx === 0 && !section.startsWith('##');
              
              // Sidebar items ko yahan skip karenge
              const isSidebarItem = ["PROS", "CONS", "FAQ", "QUESTIONS"].some(k => rawTitle.toUpperCase().includes(k));
              if (isSidebarItem && !isIntro) return null;

              const body = isIntro ? section : lines.slice(1).join('\n');
              const cleanedBody = body.replace(/\*\*/g, '').replace(/\*/g, '•').trim();

              return (
                <section key={idx} className={isIntro ? "border-l-4 border-blue-600 pl-8" : ""}>
                  {!isIntro && <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-10 uppercase italic underline decoration-blue-100 decoration-8 underline-offset-[-2px]">{rawTitle}</h2>}
                  <div className={`text-xl leading-[1.9] text-gray-600 whitespace-pre-wrap font-medium ${isIntro ? 'text-2xl text-gray-900 font-bold' : ''}`}>
                    {cleanedBody}
                  </div>
                </section>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Pros, Cons, & FAQ Cards */}
          <aside className="space-y-8">
            {sections.map((section: string, idx: number) => {
              const lines = section.split('\n');
              const rawTitle = lines[0].replace(/\*/g, '').trim();
              const body = lines.slice(1).join('\n').trim();
              const cleanedBody = body.replace(/\*\*/g, '').replace(/\*/g, '•').replace(/-/g, '•').trim();

              const isPros = rawTitle.toUpperCase().includes("PROS");
              const isCons = rawTitle.toUpperCase().includes("CONS");
              const isFaq = rawTitle.toUpperCase().includes("FAQ") || rawTitle.toUpperCase().includes("QUESTION");

              if (!isPros && !isCons && !isFaq) return null;

              return (
                <div key={idx} className={`p-10 rounded-[3rem] border shadow-sm transition-all hover:shadow-xl ${
                  isPros ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 
                  isCons ? 'bg-red-50/50 border-red-100 text-red-900' : 
                  'bg-white border-gray-100 text-gray-600'
                }`}>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 underline decoration-2 underline-offset-8">{rawTitle}</h3>
                  <div className="text-lg leading-relaxed whitespace-pre-wrap font-semibold italic">{cleanedBody}</div>
                </div>
              );
            })}
          </aside>
        </div>
        {/* --- MAGAZINE GRID END --- */}

        {/* Final CTA Card */}
        <div className="mt-40 p-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[4rem] shadow-2xl shadow-blue-200">
          <div className="bg-white p-16 md:p-32 rounded-[3.9rem] text-center relative overflow-hidden">
            <h2 className="text-6xl md:text-8xl font-black text-gray-900 mb-12 tracking-tighter leading-none">Execute <br/> {tool.name}.</h2>
            <a href={tool.website_url} target="_blank" className="inline-block bg-blue-600 text-white px-20 py-8 rounded-2xl font-black text-2xl hover:bg-black transition-all transform hover:scale-105 shadow-xl shadow-blue-200">
              Visit Official Site ↗
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}
