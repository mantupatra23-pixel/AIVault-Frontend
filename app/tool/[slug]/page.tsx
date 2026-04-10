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
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Tool Not Found</h1>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen selection:bg-blue-600 selection:text-white">
      {/* Top Branding Bar */}
      <div className="h-2 bg-blue-600 sticky top-0 z-50 shadow-sm"></div>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {/* Navigation */}
        <nav className="mb-16">
          <Link href="/" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2 hover:opacity-50 transition-all">
            ← Back to Directory
          </Link>
        </nav>

        {/* Hero Section */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-tighter">
              {tool.category}
            </span>
            <div className="w-10 h-[1px] bg-gray-200"></div>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">AIVault Editorial</span>
          </div>

          <h1 className="text-7xl md:text-[10rem] font-black text-gray-900 tracking-[-0.07em] leading-[0.75] mb-12">
            {tool.name}<span className="text-blue-600">.</span>
          </h1>

          <p className="text-2xl md:text-3xl text-gray-400 font-medium leading-tight max-w-xl">
            A deep-dive analysis of {tool.name}'s ecosystem and impact.
          </p>
        </header>

        {/* The Content Engine */}
        <div className="ai-review-content">
          <ReactMarkdown>{tool.description}</ReactMarkdown>
        </div>

        {/* High-End Call to Action */}
        <section className="mt-32">
          <div className="bg-gray-900 rounded-[3rem] p-12 md:p-24 text-center shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[120px]"></div>
            
            <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">
              Start Building <br/> with {tool.name}
            </h2>
            <p className="text-gray-400 text-lg md:text-xl mb-12 font-medium max-w-md mx-auto">
              Join the future of AI-driven workflows. Access the tool directly below.
            </p>
            
            <a 
              href={tool.website_url} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-16 py-6 rounded-2xl font-black text-xl hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 shadow-xl shadow-blue-500/20"
            >
              Visit Website ↗
            </a>
          </div>
        </section>

        {/* Minimalist Footer */}
        <footer className="mt-40 pt-10 border-t border-gray-100 text-center">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-4">
            AI VAULT ENGINE • PRODUCTION 2026
          </div>
          <div className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">
            Built for 100M+ Users
          </div>
        </footer>
      </article>
    </div>
  )
}
