import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch tool data from Supabase
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('*')
    .ilike('slug', slug)
    .single();

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-black text-gray-900">404 - Tool Not Found</h1>
        <Link href="/" className="mt-4 text-blue-600 font-bold hover:underline">← Go Back Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen selection:bg-blue-100">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-blue-600 transition-transform group-hover:-translate-x-1">←</span>
            <span className="font-bold text-gray-900">Back to AIVault</span>
          </Link>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">Tool Analysis</div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        {/* Tool Badge & Title */}
        <header className="mb-12">
          <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            {tool.category || "AI Tool"}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-4 leading-[0.9]">
            {tool.name}
          </h1>
          <p className="text-lg text-gray-500 font-medium">An in-depth review of the {tool.name} AI ecosystem.</p>
        </header>

        {/* Horizontal Divider */}
        <hr className="border-gray-100 mb-12" />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-12">
            <div className="prose prose-lg prose-blue max-w-none 
              prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-li:text-gray-600 prose-strong:text-gray-900">
              
              {/* ReactMarkdown converts text to proper HTML */}
              <ReactMarkdown>{tool.description}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="mt-20 border-t-2 border-gray-900 pt-12">
          <div className="bg-gray-900 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 blur-[100px] pointer-events-none"></div>
            
            <h2 className="text-3xl md:text-5xl font-black mb-6 relative">Ready to use {tool.name}?</h2>
            <p className="text-gray-400 mb-10 text-lg relative">Join thousands of users leveraging this technology today.</p>
            
            <a 
              href={tool.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/20"
            >
              Visit Official Website ↗
            </a>
          </div>
        </section>

        {/* Disclaimer for SEO */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            © 2026 AIVault Engine • Data Updated Real-time
          </p>
        </footer>
      </article>
    </div>
  );
}
