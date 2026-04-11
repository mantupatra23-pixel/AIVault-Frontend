'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else router.push('/admin')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8f9fb] p-6">
      <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center">
        <h1 className="text-4xl font-[1000] tracking-tighter mb-2 uppercase italic">Vault Access</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-10">Executive Encryption Only</p>
        
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Founder Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-5 bg-gray-50 border-none rounded-2xl mt-2 font-bold focus:ring-2 focus:ring-blue-600 outline-none" placeholder="mantu@visora.ai" />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Access Key</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-5 bg-gray-50 border-none rounded-2xl mt-2 font-bold focus:ring-2 focus:ring-blue-600 outline-none" placeholder="••••••••" />
          </div>
          <button className="w-full bg-black text-white py-5 rounded-2xl font-[1000] uppercase tracking-widest text-xs shadow-2xl hover:bg-blue-600 transition-all">Authorize Entry ↗</button>
        </form>
      </div>
    </main>
  )
}
