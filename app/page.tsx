'use client'

import { useState } from 'react'
import { handleAction } from './actions'

export default function Home() {
  const [mode, setMode] = useState<'login' | 'request'>('login')
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  async function handleSubmit(formData: FormData) {
    formData.append('actionType', mode)
    const res = await handleAction(formData)

    if (res?.error) {
      setMsg({ text: res.error, type: 'error' })
    } 
    // @ts-ignore
    else if (res?.success === true) {
      window.location.href = '/shop'
    } 
    // @ts-ignore
    else if (res?.success) {
      setMsg({ text: res.success, type: 'success' })
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 text-white overflow-hidden">
      {/* Bahnhof-Hintergrund */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549646487-13350901e138?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 z-0 bg-black/75" />

      <div className="relative z-10 max-w-sm w-full border border-zinc-700 p-8 rounded-none bg-black/60 backdrop-blur-sm">
        <h1 className="text-4xl font-black mb-8 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4">
          Bellator
        </h1>
        
        <form action={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <input 
              name="accessKey" required 
              className="w-full bg-transparent border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600" 
              placeholder="ENTER KEY" 
            />
          ) : (
            <input 
              name="email" type="email" required 
              className="w-full bg-transparent border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600" 
              placeholder="EMAIL ADDRESS" 
            />
          )}
          
          <button 
            type="submit" 
            className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            {mode === 'login' ? 'Enter' : 'Request Access'}
          </button>
        </form>

        <button 
          onClick={() => { setMode(mode === 'login' ? 'request' : 'login'); setMsg(null); }} 
          className="mt-6 w-full text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
        >
          {mode === 'login' ? 'Request Access' : 'Back to Login'}
        </button>

        {msg && (
          <p className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === 'error' ? 'text-red-600' : 'text-green-500'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </main>
  )
}
