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
    <main className="min-h-screen bg-[#fcfcfc] text-gray-900 selection:bg-blue-600 selection:text-white pb-32 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10"></div>

      <nav className="max-w-6xl mx-auto p-10 flex justify-between items-center">
        <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-all">
          <span className="group-hover:-translate-x-2 transition-transform">←</span> Return to Vault
        </Link>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      </nav>

      <article className="max-w-4xl mx-auto px-6">
        <header className="pt-20 pb-24">
          <div className="inline-flex items-center gap-3 mb-10">
              <span className="bg-blue-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{tool.category}</span>
              <div className="h-px w-12 bg-gray-200"></div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">AIVault Editorial</span>
          </div>
          
          <h1 className="text-6xl md:text-[100px] font-[1000] tracking-[-0.06em] leading-[0.85] text-gray-900 mb-16 break-words">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          <div className="flex flex-wrap items-center gap-6 opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="text-lg">💰</span> {tool.pricing}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="text-lg">⭐</span> Score: {tool.score || 88}/100
              </span>
          </div>
        </header>

        {/* MANTU'S TAKE - High Impact */}
        <section className="mb-24 border-l-4 border-blue-600 pl-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Founder's Take</h4>
            <p className="text-2xl font-bold tracking-tight text-gray-800 leading-relaxed italic">
                "This tool is built for high-performance workflows. Agar aap automation mein serious hain, toh iska execution level matchless hai."
            </p>
        </section>

        {/* MAIN DESCRIPTION - Fixed Drop Cap Logic */}
        <section className="text-gray-600 leading-[1.9] font-medium text-xl space-y-12 mb-32">
          {tool.description.split('\n').filter(Boolean).map((para: string, i: number) => (
            <p key={i} className={i === 0 ? "first-letter:text-7xl first-letter:font-black first-letter:text-gray-900 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]" : ""}>
                {para.replace(/[*#]/g, '').trim()}
            </p>
          ))}
        </section>

        {/* ANALYSIS - Split Clean Design */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div className="bg-white border border-gray-100 p-12 rounded-[3rem] shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600 mb-8 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[10px]">✓</span> Competitive Edge
                </h3>
                <div className="text-gray-500 font-bold text-sm leading-relaxed whitespace-pre-line">
                    {tool.pros_cons ? tool.pros_cons.split('Cons:')[0].replace(/[*#]|Pros:/g, '').trim() : "Highly efficient system architecture."}
                </div>
            </div>
            <div className="bg-white border border-gray-100 p-12 rounded-[3rem] shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-8 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px]">✕</span> Limitations
                </h3>
                <div className="text-gray-500 font-bold text-sm leading-relaxed whitespace-pre-line">
                    {tool.pros_cons && tool.pros_cons.includes('Cons:') ? tool.pros_cons.split('Cons:')[1].replace(/[*#]/g, '').trim() : "Initial learning curve for advanced features."}
                </div>
            </div>
        </section>

        {/* FAQ - Clean Interaction */}
        {tool.faq && (
          <section className="mb-40">
            <h3 className="text-3xl font-[1000] tracking-tighter mb-16 uppercase italic">Intelligence FAQ</h3>
            <div className="space-y-6">
                {tool.faq.split('Q:').filter(Boolean).map((item: string, i: number) => {
                    const [q, a] = item.split('A:');
                    return (
                        <div key={i} className="bg-white border border-gray-100 p-10 rounded-[2.5rem] hover:border-blue-600 transition-all duration-300">
                            <h4 className="font-black text-lg text-gray-900 mb-4 flex gap-3 italic">
                                <span className="text-blue-600 not-italic">Q.</span> {q?.replace(/[*#]/g, '').trim()}
                            </h4>
                            <p className="text-gray-500 font-bold leading-relaxed text-sm opacity-80">
                                {a?.replace(/[*#]/g, '').trim()}
                            </p>
                        </div>
                    );
                })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-gray-900 rounded-[4rem] p-16 md:p-24 text-center text-white overflow-hidden">
             <h2 className="text-5xl md:text-8xl font-[1000] tracking-tighter mb-12 italic uppercase">Execute<br/>Now<span className="text-blue-600">.</span></h2>
             <a 
              href={tool.website_url} 
              target="_blank" 
              className="inline-block bg-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-blue-600 transition-all shadow-2xl"
            >
              Access Official Interface ↗
            </a>
          </div>
        </section>
      </article>

      <footer className="text-center mt-40 opacity-20 text-[10px] font-black uppercase tracking-[0.5em]">
        © 2026 AI VAULT ENGINE • BHARAT
      </footer>
    </main>
  )
}
