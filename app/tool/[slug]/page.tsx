import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// Supabase Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Dynamic Route Page Component
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 1. Next.js ke naye version mein params ko await karna mandatory hai
  const resolvedParams = await params;
  const toolSlug = resolvedParams.slug;

  // 2. Database se tool fetch karna (ilike use kiya hai taaki capital/small letter ka issue na ho)
  const { data: tool, error } = await supabase
    .from('ai_tools')
    .select('*')
    .ilike('slug', toolSlug) 
    .maybeSingle();

  // 3. Agar tool nahi mila toh clean Error UI
  if (!tool) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-white">
        <h1 className="text-9xl font-black text-gray-100 italic">404</h1>
        <p className="text-2xl text-gray-800 font-bold mt-4">Tool Not Found!</p>
        <p className="text-gray-500 mt-2 max-w-xs">Hum Vault mein "{toolSlug}" ko dhoond nahi paye. Shayad slug galat hai?</p>
        <Link href="/" className="mt-8 bg-black text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
          ← Back to Directory
        </Link>
      </div>
    )
  }

  // 4. Tool mil gaya toh Final Sundar UI
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-screen bg-white">
      {/* Navigation */}
      <nav className="mb-12">
        <Link href="/" className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
          <span className="text-xl">←</span> AIVault Directory
        </Link>
      </nav>
      
      {/* Header Section */}
      <header className="border-b border-gray-100 pb-10">
        <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter mb-4">
          {tool.category}
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight">
          {tool.name}
        </h1>
      </header>

      {/* Review Section */}
      <main className="mt-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
          AI Review & Insights
        </h2>
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
          {tool.description}
        </div>
      </main>

      {/* Call to Action Box */}
      <section className="mt-16 p-10 bg-gray-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-3">Try {tool.name} Today</h3>
          <p className="text-gray-400 mb-8 max-w-md">Experience the power of this AI tool. Click below to head over to their official platform.</p>
          <a 
            href={tool.website_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-500 hover:scale-105 transition-all"
          >
            Visit Official Website
            <span className="ml-3 text-2xl">↗</span>
          </a>
        </div>
        {/* Decorative Circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl"></div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="mt-24 py-10 border-t border-gray-50 text-center text-gray-400 text-sm italic">
        AIVault provides automated reviews. Please check official sites for latest pricing and features.
      </footer>
    </div>
  )
}
