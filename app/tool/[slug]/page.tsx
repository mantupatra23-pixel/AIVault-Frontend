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
    if (!tool) return { title: 'Tool Not Found' };
    return { title: `${tool.name} Review | AIVault` };
  } catch (e) {
    return { title: 'AIVault Review' };
  }
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Data Fetching with Error Handling
  const { data: tool, error } = await supabase.from('ai_tools').select('*').ilike('slug', slug).single();

  if (error || !tool) {
    notFound(); // Ye 404 page dikhayega, server crash nahi karega
  }

  const sections = tool.description ? tool.description.split('##').map((sec: string) => sec.trim()).filter(Boolean) : [];

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <div className="h-1.5 bg-blue-600 sticky top-0 z-[110]"></div>
      <article className="max-w-6xl mx-auto px-6 py-16">
        <nav className="mb-12">
          <Link href="/" className="text-[10px] font-black text-blue-600 uppercase tracking-widest">← Back to Directory</Link>
        </nav>

        <header className="mb-20 flex flex-col md:flex-row gap-12 items-center border-b pb-16">
          <div className="w-40 h-40 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center overflow-hidden">
            {tool.image_url ? (
               <img src={tool.image_url} alt={tool.name} className="w-full h-full object-contain p-6" />
            ) : (
               <span className="text-4xl font-black text-blue-600 opacity-20">{tool.name.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter">{tool.name}<span className="text-blue-600">.</span></h1>
        </header>

        {/* Baki ka content structure wahi rahega jo pichle code mein tha */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-20">
            <div className="text-xl leading-relaxed text-gray-600">
                {sections[0]?.replace(/\*/g, '')}
            </div>
            <aside className="bg-gray-50 p-8 rounded-[2rem] border">
                <h3 className="font-black uppercase mb-4">Quick Links</h3>
                <a href={tool.website_url} target="_blank" className="text-blue-600 font-bold">Official Site ↗</a>
            </aside>
        </div>
      </article>
    </div>
  )
}
