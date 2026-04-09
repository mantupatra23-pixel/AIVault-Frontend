import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const { data: tools } = await supabase.from('ai_tools').select('*')

  return (
    <div className="min-h-screen bg-white p-10">
      <h1 className="text-5xl font-black mb-10 text-center">AIVault Directory</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tools?.map((tool) => (
          <Link href={`/tool/${tool.slug}`} key={tool.id} className="p-6 border rounded-xl hover:shadow-lg transition">
            <h2 className="text-2xl font-bold">{tool.name}</h2>
            <p className="text-gray-500">{tool.category}</p>
            <p className="mt-2 text-blue-600">Read AI Review →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
