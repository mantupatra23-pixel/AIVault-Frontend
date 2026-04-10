import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

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
    return <div className="p-20 text-center font-black text-3xl text-gray-900">TOOL NOT FOUND</div>;
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen selection:bg-blue-600 selection:text-white">
      {/* Top Accent Line */}
      <div className="h-2 bg-blue-600 sticky top-0 z-50"></div>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20 bg-white shadow-sm min-h-screen">
        {/* Navigation */}
        <nav className="mb-12">
          <Link href="/" className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
            ← Back to Directory
          </Link>
        </nav>

        {/* Hero Header */}
        <header className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
              {tool.category}
            </span>
            <span className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Expert Verified</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-[-0.04em] leading-[0.85] mb-8">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>
          
          <p className="text-xl text-gray-500 font-medium leading-relaxed italic border-l-4 border-gray-100 pl-6">
            The ultimate breakdown of {tool.name}: Features, performance, and real-world value.
          </p>
        </header>

        {/* Main Review Content */}
        <div className="prose prose-lg prose-slate max-w-none 
          prose-headings:text-gray-900 prose-headings:font-black prose-headings:tracking-tighter
          prose-h2:text-4xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pt-8 prose-h2:border-t prose-h2:border-gray-50
          prose-p:text-gray-600 prose-p:leading-loose
          prose-strong:text-gray-900 prose-strong:font-black
          prose-li:text-gray-600 prose-ul:list-square prose-li:marker:text-blue-600">
          
          <ReactMarkdown>{tool.description}</ReactMarkdown>
        </div>

        {/* Action Section */}
        <section className="mt-24">
          <div className="bg-blue-600 p-10 md:p-16 rounded-[2rem] text-center text-white shadow-2xl shadow-blue-200">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Start using {tool.name}</h2>
            <p className="text-blue-100 mb-10 text-lg font-medium opacity-80">Stop waiting. Level up your workflow with this AI today.</p>
            
            <a 
              href={tool.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white text-blue-600 px-12 py-5 rounded-2xl font-black text-xl hover:bg-gray-900 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Go to Official Site ↗
            </a>
          </div>
        </section>

        {/* Footer info */}
        <footer className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          <span>AIVault Engine v2.0</span>
          <span>© 2026 Mantu Patra</span>
        </footer>
      </article>
    </div>
  )
}
