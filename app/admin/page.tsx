'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Initializing Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  const router = useRouter()
  const [tools, setTools] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, categories: 0, monetized: 0 })
  const [loading, setLoading] = useState(true)
  const [isTriggering, setIsTriggering] = useState(false)
  
  const [editingTool, setEditingTool] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  // 🛡️ SECURITY: Access Control
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== 'mantupatra23@gmail.com') {
      router.push('/login')
    } else {
      fetchData()
    }
  }

  // 📊 DATA FETCHING ENGINE
  async function fetchData() {
    setLoading(true)
    try {
      console.log("AIVault: Initiating data fetch from ai_tools...")
      
      const { data, count, error } = await supabase
        .from('ai_tools')
        .select('*', { count: 'exact' })
        .order('click_count', { ascending: false })
      
      if (error) {
        console.error("Supabase Error:", error.message)
        return
      }
      
      if (data) {
        console.log(`AIVault: Received ${data.length} records.`)
        setTools(data)
        const uniqueCats = new Set(data.map(t => t.category)).size
        const monetizedCount = data.filter(t => t.affiliate_url).length
        setStats({ total: count || 0, categories: uniqueCats, monetized: monetizedCount })
      }
    } catch (err) { 
        console.error("Fatal Fetch Error:", err) 
    } finally { 
        setLoading(false) 
    }
  }

  // 💸 SYNC & UPDATE
  async function handleUpdate() {
    const { error } = await supabase
      .from('ai_tools')
      .update({
        name: editingTool.name,
        category: editingTool.category,
        description: editingTool.description,
        pricing: editingTool.pricing,
        affiliate_url: editingTool.affiliate_url,
        is_featured: editingTool.is_featured,
        score: editingTool.score
      })
      .eq('id', editingTool.id)

    if (!error) {
      setIsEditOpen(false)
      fetchData()
      alert("✅ Vault Synced Successfully.")
    } else { 
        alert("Sync Failed: " + error.message) 
    }
  }

  // 🗑️ TERMINATE
  async function deleteTool(id: string, name: string) {
    if (confirm(`Mantu, terminate '${name}' intelligence permanently?`)) {
      const { error } = await supabase.from('ai_tools').delete().eq('id', id)
      if (!error) fetchData()
    }
  }

  // 🤖 ROBOT TRIGGER
  async function triggerRobot() {
    setIsTriggering(true)
    try {
      await fetch('https://aivault-faqc.onrender.com/auto-pilot', { mode: 'no-cors' })
      alert("🚀 DISCOVERY SIGNAL SENT.")
    } finally { 
        setTimeout(() => setIsTriggering(false), 2000) 
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] font-black uppercase tracking-[0.5em] text-blue-600 animate-pulse">
        Accessing Neural Hub...
    </div>
  )

  return (
    <main className="min-h-screen bg-[#f8f9fb] p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-5xl font-[1000] tracking-tighter text-gray-900 uppercase italic">Control Hub<span className="text-blue-600">.</span></h1>
                <button onClick={handleLogout} className="text-[8px] font-black text-red-500 border border-red-100 px-2 py-1 rounded hover:bg-red-50 uppercase">Logout</button>
            </div>
            <p className="text-blue-600 font-black text-[10px] tracking-[0.4em] uppercase">Executive: Mantu Patra</p>
        </div>
        <button onClick={triggerRobot} disabled={isTriggering} className="bg-black text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50">
            {isTriggering ? '⏳ Signaling Engine...' : '🚀 Execute Discovery'}
        </button>
      </div>

      {/* STATS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Intelligence</span>
              <div className="text-7xl font-[1000] text-gray-900 tracking-tighter mt-2">{stats.total}</div>
          </div>
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 border-l-4 border-l-green-500">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Monetized Tools</span>
              <div className="text-7xl font-[1000] text-green-600 tracking-tighter mt-2">{stats.monetized}</div>
          </div>
          <div className="bg-blue-600 p-12 rounded-[3.5rem] shadow-2xl shadow-blue-100 text-white flex flex-col justify-center">
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">System Health</span>
              <div className="text-3xl font-[1000] tracking-tighter mt-2 italic uppercase">Optimal</div>
          </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="max-w-7xl mx-auto bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden mb-20">
          <div className="overflow-x-auto">
              {tools.length === 0 ? (
                <div className="p-20 text-center font-bold text-gray-400 uppercase tracking-widest">
                    No data detected in 'ai_tools' table. Check Supabase connection.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                          <th className="px-10 py-10">Neural Entity</th>
                          <th className="px-10 py-10">Clicks</th>
                          <th className="px-10 py-10">Monetization</th>
                          <th className="px-10 py-10 text-right">Operations</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {tools.map((tool) => (
                          <tr key={tool.id} className="hover:bg-blue-50/20 transition-all group">
                              <td className="px-10 py-10">
                                  <div className="font-black text-gray-900 text-xl tracking-tight capitalize flex items-center gap-2">
                                    {tool.name}
                                    {tool.is_featured && <span className="text-[8px] bg-amber-400 text-black px-2 py-0.5 rounded tracking-widest italic">HOT</span>}
                                  </div>
                                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{tool.category}</div>
                              </td>
                              <td className="px-10 py-10">
                                  <div className="text-2xl font-black text-gray-900 tracking-tighter">{tool.click_count || 0}</div>
                              </td>
                              <td className="px-10 py-10">
                                  {tool.affiliate_url ? (
                                      <span className="text-[9px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-widest">$$ Active</span>
                                  ) : (
                                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic opacity-40">Unmonetized</span>
                                  )}
                              </td>
                              <td className="px-10 py-10 text-right space-x-4">
                                  <button onClick={() => { setEditingTool(tool); setIsEditOpen(true); }} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">Setup</button>
                                  <button onClick={() => deleteTool(tool.id, tool.name)} className="text-red-400 hover:text-red-600 font-black text-[9px] uppercase transition-all">Terminate</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
                </table>
              )}
          </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && editingTool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-4xl font-[1000] tracking-tighter uppercase italic mb-10 border-b-4 border-green-500 inline-block pb-2">Sync Intelligence</h2>
                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Affiliate Link</label>
                        <input className="w-full border-2 border-gray-50 bg-gray-50/50 p-5 rounded-3xl mt-2 font-bold focus:ring-2 focus:ring-green-500 outline-none text-blue-600" value={editingTool.affiliate_url || ''} onChange={(e) => setEditingTool({...editingTool, affiliate_url: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <input type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={editingTool.is_featured} onChange={(e) => setEditingTool({...editingTool, is_featured: e.target.checked})} />
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-900">Featured (HOT)</label>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Score</label>
                            <input type="number" className="w-full border-2 border-gray-50 bg-gray-50/50 p-5 rounded-3xl mt-2 font-bold outline-none" value={editingTool.score} onChange={(e) => setEditingTool({...editingTool, score: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                        <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white p-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-black transition-all">Save Changes ↗</button>
                        <button onClick={() => setIsEditOpen(false)} className="bg-gray-100 text-gray-400 px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-gray-200">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  )
}
