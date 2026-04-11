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
  const [stats, setStats] = useState({ total: 0, categories: 0 })
  const [loading, setLoading] = useState(true)
  const [isTriggering, setIsTriggering] = useState(false)
  
  // Modal & Edit State
  const [editingTool, setEditingTool] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  // 🛡️ SECURITY: Founder-Only Gatekeeper
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Yahan apni registered email verify karein
    if (!user || user.email !== 'mantupatra23@gmail.com') {
      router.push('/login')
    } else {
      fetchStats()
    }
  }

  async function fetchStats() {
    try {
      const { data, count, error } = await supabase
        .from('ai_tools')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (data) {
        setTools(data)
        const uniqueCats = new Set(data.map(t => t.category)).size
        setStats({ total: count || 0, categories: uniqueCats })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // 📝 UPDATE LOGIC
  async function handleUpdate() {
    const { error } = await supabase
      .from('ai_tools')
      .update({
        name: editingTool.name,
        category: editingTool.category,
        description: editingTool.description,
        pricing: editingTool.pricing,
        score: editingTool.score
      })
      .eq('id', editingTool.id)

    if (!error) {
      setIsEditOpen(false)
      fetchStats()
      alert("✅ Vault Synced: Intelligence Updated.")
    } else { alert("Sync Failed: " + error.message) }
  }

  // 🗑️ TERMINATE LOGIC
  async function deleteTool(id: string, name: string) {
    if (confirm(`Mantu, terminate '${name}' intelligence permanently?`)) {
      const { error } = await supabase.from('ai_tools').delete().eq('id', id)
      if (!error) fetchStats()
    }
  }

  // 🤖 ROBOT TRIGGER
  async function triggerRobot() {
    setIsTriggering(true)
    try {
      await fetch('https://aivault-faqc.onrender.com/auto-pilot', { mode: 'no-cors' })
      alert("🚀 DISCOVERY SIGNAL SENT. 10 tools incoming...")
    } finally { setTimeout(() => setIsTriggering(false), 2000) }
  }

  // 🚪 LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Authenticating Founder...</p>
        </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#f8f9fb] p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* EXECUTIVE HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-5xl font-[1000] tracking-tighter text-gray-900 uppercase italic">Control Hub<span className="text-blue-600">.</span></h1>
                <button onClick={handleLogout} className="text-[8px] font-black text-red-500 border border-red-100 px-2 py-1 rounded hover:bg-red-50 uppercase">Exit Vault</button>
            </div>
            <p className="text-blue-600 font-black text-[10px] tracking-[0.4em] uppercase">Verified Session: Mantu Patra</p>
        </div>
        <button 
            onClick={triggerRobot}
            disabled={isTriggering}
            className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
        >
            {isTriggering ? '⏳ Signaling Engine...' : '🚀 Execute Discovery'}
        </button>
      </div>

      {/* METRICS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Inventory Size</span>
              <div className="text-7xl font-[1000] text-gray-900 tracking-tighter mt-2">{stats.total}</div>
          </div>
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Active Sectors</span>
              <div className="text-7xl font-[1000] text-gray-900 tracking-tighter mt-2">{stats.categories}</div>
          </div>
          <div className="bg-black p-12 rounded-[3.5rem] shadow-2xl shadow-blue-100 text-white flex flex-col justify-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Core Engine</span>
              <div className="text-3xl font-[1000] tracking-tighter mt-2 italic uppercase">System Optimal</div>
          </div>
      </div>

      {/* INTELLIGENCE TABLE */}
      <div className="max-w-7xl mx-auto bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden mb-20">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                          <th className="px-10 py-10">Neural Entity</th>
                          <th className="px-10 py-10">Access Mode</th>
                          <th className="px-10 py-10 text-right">Operations</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {tools.map((tool) => (
                          <tr key={tool.id} className="hover:bg-blue-50/20 transition-all group">
                              <td className="px-10 py-10">
                                  <div className="font-black text-gray-900 text-xl tracking-tight capitalize group-hover:text-blue-600 transition-colors">{tool.name}</div>
                                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">{tool.category}</div>
                              </td>
                              <td className="px-10 py-10 font-black text-gray-400 text-[10px] uppercase">{tool.pricing}</td>
                              <td className="px-10 py-10 text-right space-x-4">
                                  <button 
                                    onClick={() => { setEditingTool(tool); setIsEditOpen(true); }}
                                    className="bg-gray-100 text-gray-900 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                  >
                                      Modify
                                  </button>
                                  <button 
                                    onClick={() => deleteTool(tool.id, tool.name)}
                                    className="text-red-500 hover:bg-red-50 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all"
                                  >
                                      Terminate
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* --- EDIT INTELLIGENCE MODAL --- */}
      {isEditOpen && editingTool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-4xl font-[1000] tracking-tighter uppercase italic mb-10 border-b-4 border-blue-600 inline-block pb-2">Modify Entity</h2>
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</label>
                            <input className="w-full border-2 border-gray-50 bg-gray-50/50 p-5 rounded-3xl mt-2 font-bold focus:ring-2 focus:ring-blue-600 outline-none" value={editingTool.name} onChange={(e) => setEditingTool({...editingTool, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Score (1-100)</label>
                            <input type="number" className="w-full border-2 border-gray-50 bg-gray-50/50 p-5 rounded-3xl mt-2 font-bold outline-none" value={editingTool.score} onChange={(e) => setEditingTool({...editingTool, score: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analysis Segment</label>
                        <textarea className="w-full border-2 border-gray-50 bg-gray-50/50 p-6 rounded-3xl mt-2 font-medium h-48 outline-none leading-relaxed" value={editingTool.description} onChange={(e) => setEditingTool({...editingTool, description: e.target.value})} />
                    </div>
                    <div className="flex gap-4 pt-6">
                        <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white p-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-black transition-all">Sync To Vault ↗</button>
                        <button onClick={() => setIsEditOpen(false)} className="bg-gray-100 text-gray-400 px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-gray-200">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  )
}
