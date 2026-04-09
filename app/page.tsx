import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// Next.js ko batata hai ki har baar naya data fetch kare
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  // Database se saare tools mangwao
  const { data: tools, error } = await supabase
    .from('ai_tools')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-4">
            AI<span className="text-blue-600">Vault</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the best AI tools, curated and reviewed automatically. 
            The world's biggest AI directory is here.
          </p>
        </div>
      </header>

      {/* Tools Grid Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Latest AI Tools</h2>
          <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-semibold">
            {tools?.length || 0} Tools Found
          </span>
        </div>

        {/* Grid layout for tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools && tools.length > 0 ? (
            tools.map((tool) => (
              <Link href={`/tool/${tool.slug}`} key={tool.id}>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between">
                  <div>
                    <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">
                      {tool.category}
                    </p>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-4">
                      {tool.name}
                    </h3>
                    <p className="text-gray-500 line-clamp-3 text-sm leading-relaxed">
                      Click to read the full AI review and detailed features for {tool.name}...
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center text-blue-600 font-bold group">
                    View Tool Details 
                    <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-lg">No tools in the Vault yet. Run your automation script!</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 text-center text-gray-400 text-sm">
        © 2026 AIVault - Built by Mantu Patra
      </footer>
    </main>
  )
}
