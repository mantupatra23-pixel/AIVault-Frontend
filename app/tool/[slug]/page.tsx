import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tool) return notFound()

  return (
    <main className="min-h-screen bg-[#fcfcfc] font-sans pb-20">
      {/* Top Navigation Bar */}
      <nav className="max-w-7xl mx-auto p-6 flex justify-between items-center">
        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">← Back to Directory</Link>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 italic">AIVault Intelligence</div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 pt-20">
        {/* HEADER SECTION */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="bg-black text-white text-[8px] font-black px-3 py-1 rounded uppercase tracking-widest">{tool.category}</span>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Verified by Mantu Patra</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-[1000] tracking-tighter text-gray-900 leading-[0.8] mb-12">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          {tool.score && (
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 mb-10">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Vault Score:</span>
                <span className="text-lg font-[1000] text-blue-700">{tool.score}/100</span>
            </div>
          )}
        </header>

        {/* MAIN DESCRIPTION */}
        <section className="prose prose-xl max-w-none text-gray-600 leading-[1.8] font-medium mb-20">
          <div className="h-1 w-20 bg-blue-600 mb-12 rounded-full"></div>
          {tool.description.split('\n').map((para: string, i: number) => (
            <p key={i} className="mb-8">{para}</p>
          ))}
        </section>

        {/* PROS & CONS SECTION */}
        {tool.pros_cons && (
          <section className="bg-white border-2 border-gray-50 rounded-[3rem] p-10 md:p-16 my-16 shadow-sm">
            <h3 className="text-2xl font-[1000] uppercase tracking-tighter text-gray-900 mb-10 italic">Analysis: Pros & Cons</h3>
            <div className="text-gray-500 leading-relaxed font-medium whitespace-pre-line italic text-lg border-l-4 border-blue-600 pl-8">
                {tool.pros_cons}
            </div>
          </section>
        )}

        {/* FAQ SECTION */}
        {tool.faq && (
          <section className="my-20">
            <div className="flex items-center gap-6 mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] whitespace-nowrap text-gray-400">Frequently Asked Questions</h3>
                <div className="h-px w-full bg-gray-100"></div>
            </div>
            <div className="grid gap-8">
                {tool.faq.split('Q:').filter(Boolean).map((item: string, i: number) => {
                    const [q, a] = item.split('A:');
                    return (
                        <div key={i} className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100/50 hover:bg-white transition-colors">
                            <h4 className="font-black text-gray-900 mb-3 flex gap-3">
                                <span className="text-blue-600">Q.</span> {q?.trim()}
                            </h4>
                            <p className="text-gray-500 font-medium leading-relaxed pl-7">
                                {a?.trim()}
                            </p>
                        </div>
                    );
                })}
            </div>
          </section>
        )}

        {/* CTA SECTION */}
        <section className="mt-32">
          <div className="bg-blue-600 rounded-[4rem] p-12 md:p-24 text-center text-white shadow-2xl shadow-blue-200">
            <h2 className="text-5xl md:text-8xl font-[1000] tracking-tighter mb-12 leading-none uppercase italic">Execute<br/>{tool.name}</h2>
            <a 
              href={tool.website_url} 
              target="_blank" 
              className="inline-block bg-white text-blue-600 px-12 py-6 rounded-2xl font-[1000] uppercase tracking-widest text-sm hover:scale-105 transition-all"
            >
              Visit Official Site ↗
            </a>
          </div>
        </section>
      </article>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 mt-40 pt-20 border-t border-gray-50 text-center opacity-30">
        <div className="text-[10px] font-black uppercase tracking-[0.5em]">Optimized for High-Speed Global Traffic • AIVault</div>
      </footer>
    </main>
  )
}
