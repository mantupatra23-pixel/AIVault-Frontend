import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: tool } = await supabase.from('ai_tools').select('*').eq('slug', slug).single()
  if (!tool) return notFound()

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 selection:bg-blue-600 selection:text-white pb-32">
      {/* Dynamic Background Accent */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10"></div>

      {/* Nav */}
      <nav className="max-w-6xl mx-auto p-10 flex justify-between items-center">
        <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-all">
          <span className="group-hover:-translate-x-2 transition-transform">←</span> Return to Vault
        </Link>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        {/* HERO SECTION */}
        <header className="pt-20 pb-24 text-center md:text-left">
          <div className="inline-flex items-center gap-3 mb-10">
              <span className="bg-blue-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{tool.category}</span>
              <div className="h-px w-12 bg-gray-200"></div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">AIVault Editorial</span>
          </div>
          
          <h1 className="text-7xl md:text-[110px] font-[1000] tracking-[-0.06em] leading-[0.85] text-gray-900 mb-16">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          <div className="flex flex-wrap items-center gap-6 opacity-60">
              <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">💰</div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{tool.pricing}</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">🔥</div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Score: {tool.score || 85}/100</span>
              </div>
          </div>
        </header>

        {/* MANTU'S EXCLUSIVE TAKE */}
        <section className="mb-24 relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600 rounded-full"></div>
            <div className="pl-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Founder's Execution Take</h4>
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800 leading-relaxed italic">
                    "This tool is built for high-performance workflows. Agar aap automation mein serious hain, toh iska execution level matchless hai."
                </p>
            </div>
        </section>

        {/* CONTENT BODY */}
        <section className="prose prose-2xl max-w-none text-gray-600 leading-[1.9] font-medium space-y-12 mb-32">
          {tool.description.split('\n').filter(Boolean).map((para: string, i: number) => (
            <p key={i} className="first-letter:text-5xl first-letter:font-black first-letter:text-gray-900 first-letter:mr-3 first-letter:float-left">{para}</p>
          ))}
        </section>

        {/* PROS & CONS GRID */}
        {tool.pros_cons && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-green-600 mb-8 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-xs">✓</span> Competitive Edge
                </h3>
                <div className="text-gray-500 leading-loose font-bold text-sm whitespace-pre-line">
                    {tool.pros_cons.split('Cons:')[0].replace('Pros:', '').trim()}
                </div>
            </div>
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-8 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-xs">✕</span> Limitations
                </h3>
                <div className="text-gray-500 leading-loose font-bold text-sm whitespace-pre-line">
                    {tool.pros_cons.includes('Cons:') ? tool.pros_cons.split('Cons:')[1].trim() : 'Highly optimized system with minimal constraints.'}
                </div>
            </div>
          </section>
        )}

        {/* FAQ ACCORDION STYLE */}
        {tool.faq && (
          <section className="mb-40">
            <h3 className="text-4xl font-[1000] tracking-tighter mb-16 italic uppercase underline decoration-blue-600 decoration-4 underline-offset-8">Intelligence FAQ</h3>
            <div className="space-y-6">
                {tool.faq.split('Q:').filter(Boolean).map((item: string, i: number) => {
                    const [q, a] = item.split('A:');
                    return (
                        <div key={i} className="group bg-white border border-gray-100 p-10 rounded-[2.5rem] hover:border-blue-600 transition-all duration-500">
                            <h4 className="font-[1000] text-xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors tracking-tight">
                                {q?.trim()}
                            </h4>
                            <p className="text-gray-500 font-bold leading-relaxed text-sm opacity-80 group-hover:opacity-100">
                                {a?.trim()}
                            </p>
                        </div>
                    );
                })}
            </div>
          </section>
        )}

        {/* FINAL EXECUTE CTA */}
        <section className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-900 rounded-[4.5rem] p-16 md:p-32 text-center text-white overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full"></div>
             <h2 className="text-6xl md:text-[120px] font-[1000] tracking-[-0.07em] mb-16 leading-[0.8] italic uppercase">Execute<br/>Now<span className="text-blue-600">.</span></h2>
             <a 
              href={tool.website_url} 
              target="_blank" 
              className="inline-flex items-center gap-4 bg-blue-600 text-white px-16 py-8 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-blue-600 transition-all shadow-2xl"
            >
              Access Official Interface ↗
            </a>
          </div>
        </section>
      </article>
    </main>
  )
}
