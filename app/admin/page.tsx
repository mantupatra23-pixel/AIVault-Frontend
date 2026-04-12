'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  const router = useRouter()
  const [tools, setTools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTool, setEditingTool] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== 'mantupatra23@gmail.com') router.push('/login')
    else fetchData()
  }

  async function fetchData() {
    const { data } = await supabase.from('ai_tools').select('*').order('created_at', { ascending: false })
    if (data) setTools(data)
    setLoading(false)
  }

  async function handleUpdate() {
    const { error } = await supabase
      .from('ai_tools')
      .update({
        name: editingTool.name,
        affiliate_url: editingTool.affiliate_url,
        is_featured: editingTool.is_featured,
        youtube_id: editingTool.youtube_id, // NEW: YouTube Link
        description: editingTool.description
      })
      .eq('id', editingTool.id)

    if (!error) {
      setIsEditOpen(false)
      fetchData()
      alert("✅ Vault Updated with Video Intelligence!")
    }
  }

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest">Accessing Neural Hub...</div>

  return (
    <main className="min-h-screen bg-[#f8f9fb] p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-16">
          <h1 className="text-5xl font-[1000] tracking-tighter uppercase italic">Control Hub<span className="text-blue-600">.</span></h1>
          <div className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase">Founder Access</div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
              <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <th className="px-10 py-8">Intelligence</th>
                      <th className="px-10 py-8">Status</th>
                      <th className="px-10 py-8 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {tools.map((t) => (
                      <tr key={t.id} className="hover:bg-blue-50/20">
                          <td className="px-10 py-8">
                              <div className="font-black text-gray-900 text-lg flex items-center gap-2">
                                  {t.name} {t.youtube_id && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded italic">VIDEO</span>}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase">{t.category}</div>
                          </td>
                          <td className="px-10 py-8 text-[10px] font-black uppercase">
                              {t.affiliate_url ? <span className="text-green-500">$$ Active</span> : <span className="text-gray-300">No Link</span>}
                          </td>
                          <td className="px-10 py-8 text-right">
                              <button onClick={() => { setEditingTool(t); setIsEditOpen(true); }} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">Configure</button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* EDIT MODAL WITH VIDEO CONTROL */}
      {isEditOpen && editingTool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
                <h2 className="text-3xl font-[1000] tracking-tighter uppercase italic mb-8">Setup Entity</h2>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Affiliate URL</label>
                        <input className="w-full border-2 border-gray-50 bg-gray-50/50 p-5 rounded-3xl mt-2 font-bold outline-blue-600" value={editingTool.affiliate_url || ''} onChange={(e) => setEditingTool({...editingTool, affiliate_url: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">YouTube Video ID (Loss-Proof)</label>
                        <input className="w-full border-2 border-gray-50 bg-gray-50/50 p-5 rounded-3xl mt-2 font-bold outline-red-500" placeholder="e.g. dQw4w9WgXcQ" value={editingTool.youtube_id || ''} onChange={(e) => setEditingTool({...editingTool, youtube_id: e.target.value})} />
                        <p className="text-[8px] text-gray-400 mt-2 italic">*Link nahi, sirf ID dalo (v= ke baad wala part).</p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-3xl border border-gray-100">
                        <input type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={editingTool.is_featured} onChange={(e) => setEditingTool({...editingTool, is_featured: e.target.checked})} />
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-900">Feature (Hot Badge)</label>
                    </div>
                    <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Save & Deploy ↗</button>
                    <button onClick={() => setIsEditOpen(false)} className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest">Abort</button>
                </div>
            </div>
        </div>
      )}
    </main>
  )
}
