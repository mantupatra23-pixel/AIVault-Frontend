'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AdminDashboard() {
  const [tools, setTools] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, categories: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // 1. Fetch Data for Admin
  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data, count } = await supabase.from('ai_tools').select('*', { count: 'exact' })
    if (data) {
      setTools(data)
      setStats({ total: count || 0, categories: new Set(data.map(t => t.category)).size })
    }
    setLoading(false)
  }

  // 2. Manual Delete Function
  async function deleteTool(id: string) {
    if (confirm("Mantu, kya aap sure ho? Ye tool vault se hamesha ke liye delete ho jayega.")) {
      const { error } = await supabase.from('ai_tools').delete().eq('id', id)
      if (!error) fetchStats()
    }
  }

  // 3. Trigger AI Robot (Render Auto-Pilot)
  async function triggerRobot() {
    alert("Robot ko signal bhej diya gaya hai. 10 naye tools process ho rahe hain...")
    fetch('https://aivault-faqc.onrender.com/auto-pilot')
  }

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest">Initialising Admin Vault...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
            <h1 className="text-4xl font-[1000] tracking-tighter text-gray-900 uppercase">Vault Control Panel</h1>
            <p className="text-blue-600 font-bold text-xs tracking-[0.3em] uppercase">Authenticated: Mantu Patra (CEO)</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={triggerRobot}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 transition-all"
            >
                🚀 Run AI Discovery (10 New)
            </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tools</span>
              <div className="text-6xl font-[1000] text-blue-600 tracking-tighter">{stats.total}</div>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Categories</span>
              <div className="text-6xl font-[1000] text-gray-900 tracking-tighter">{stats.categories}</div>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-100">
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Server Status</span>
              <div className="text-4xl font-black tracking-tighter mt-2 italic uppercase">Execution Live</div>
          </div>
      </div>

      {/* TOOLS TABLE / LIST */}
      <div className="max-w-7xl mx-auto bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-black uppercase tracking-widest text-xs">Live Inventory Management</h2>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <th className="px-8 py-6">Tool Name</th>
                          <th className="px-8 py-6">Category</th>
                          <th className="px-8 py-6">Price</th>
                          <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {tools.map((tool) => (
                          <tr key={tool.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-8 py-6">
                                  <div className="font-black text-gray-900">{tool.name}</div>
                                  <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{tool.slug}</div>
                              </td>
                              <td className="px-8 py-6 font-bold text-blue-600 text-xs">{tool.category}</td>
                              <td className="px-8 py-6 text-xs font-bold">{tool.pricing}</td>
                              <td className="px-8 py-6 text-right">
                                  <button 
                                    onClick={() => deleteTool(tool.id)}
                                    className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest border border-red-100 px-4 py-2 rounded-lg hover:bg-red-50"
                                  >
                                      Delete
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </main>
  )
}
