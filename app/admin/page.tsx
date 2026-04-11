'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Standard client for Browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  const [tools, setTools] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, categories: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data, count } = await supabase
      .from('ai_tools')
      .select('*', { count: 'exact' })
    
    if (data) {
      setTools(data)
      // Category count logic
      const uniqueCats = new Set(data.map(t => t.category)).size
      setStats({ total: count || 0, categories: uniqueCats })
    }
    setLoading(false)
  }

  async function deleteTool(id: string) {
    if (confirm("Mantu, kya aap sure ho? Ye tool vault se hamesha ke liye delete ho jayega.")) {
      const { error } = await supabase.from('ai_tools').delete().eq('id', id)
      if (!error) fetchStats()
      else alert("Error deleting tool: " + error.message)
    }
  }

  async function triggerRobot() {
    alert("Robot ko signal bhej diya gaya hai. 10 naye tools process ho rahe hain...")
    // Render API hit
    try {
        await fetch('https://aivault-faqc.onrender.com/auto-pilot')
    } catch (e) {
        console.log("Trigger sent, ignoring CORS for manual hits.")
    }
  }

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-[0.5em] animate-pulse text-blue-600">Initialising Admin Vault...</div>

  return (
    <main className="min-h-screen bg-[#f8f9fb] p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
        <div>
            <h1 className="text-5xl font-[1000] tracking-tighter text-gray-900 uppercase italic">Control Hub<span className="text-blue-600">.</span></h1>
            <p className="text-blue-600 font-black text-[10px] tracking-[0.4em] uppercase mt-2">Executive Access: Mantu Patra</p>
        </div>
        <button 
            onClick={triggerRobot}
            className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95"
        >
            🚀 Run AI Discovery (10 New)
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Inventory</span>
                <div className="text-7xl font-[1000] text-gray-900 tracking-tighter mt-2">{stats.total}</div>
              </div>
              <div className="h-16 w-1 bg-blue-600 rounded-full"></div>
          </div>
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Categories</span>
                <div className="text-7xl font-[1000] text-gray-900 tracking-tighter mt-2">{stats.categories}</div>
              </div>
              <div className="h-16 w-1 bg-gray-200 rounded-full"></div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                          <th className="px-10 py-8">Identity</th>
                          <th className="px-10 py-8">Classification</th>
                          <th className="px-10 py-8">Pricing</th>
                          <th className="px-10 py-8 text-right">Operations</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {tools.map((tool) => (
                          <tr key={tool.id} className="hover:bg-blue-50/20 transition-all group">
                              <td className="px-10 py-8">
                                  <div className="font-black text-gray-900 text-lg tracking-tight capitalize">{tool.name}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tool.slug}</div>
                              </td>
                              <td className="px-10 py-8">
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-md uppercase tracking-widest">{tool.category}</span>
                              </td>
                              <td className="px-10 py-8 font-black text-gray-400 text-xs">{tool.pricing}</td>
                              <td className="px-10 py-8 text-right">
                                  <button 
                                    onClick={() => deleteTool(tool.id)}
                                    className="bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
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
    </main>
  )
}
