import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const { data: tools } = await supabase.from('ai_tools').select('*')

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center py-10">
          <h1 className="text-6xl font-black text-black mb-4">AIVault</h1>
          <p className="text-xl text-gray-600">The Ultimate Directory for 10,000+ AI Tools</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools?.map((tool) => (
            <Link href={`/tool/${tool.slug}`} key={tool.id}>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer">
                <h2 className="text-2xl font-bold">{tool.name}</h2>
                <p className="text-blue-500 text-sm font-semibold mb-3">{tool.category}</p>
                <p className="text-gray-500 line-clamp-2">Read the full AI review and get access...</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
