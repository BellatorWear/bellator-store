'use client'

import { useState } from 'react'
import { handleAction } from './actions'
import { setAuthKey } from './utils/auth' // Import deiner Auth-Utility
import { useRouter } from 'next/navigation' // Router für den Redirect

export default function Home() {
  const [mode, setMode] = useState<'login' | 'request'>('login')
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    formData.append('actionType', mode)
    const res = await handleAction(formData)
    
    if (res?.error) {
      setMsg({ text: res.error, type: 'error' })
    } else if (res?.success === true) {
      // Wenn das Backend das Passwort akzeptiert:
      setAuthKey("authorized") // Cookie wird gesetzt (7 Tage gültig)
      router.push('/shop') // Redirect zur Shop-Seite
    } else if (res?.success) {
      setMsg({ text: res.success, type: 'success' })
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white overflow-hidden">
      
      {/* Hintergrund */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549646487-13350901e138?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-0 bg-black/75" />

      {/* Login Box */}
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-black mb-8 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4">
          Bellator
        </h1>
        
        <form action={handleSubmit} className="space-y-4">
          <input 
            name={mode === 'login' ? 'accessKey' : 'email'} 
            type={mode === 'login' ? 'text' : 'email'}
            required 
            className="w-full bg-transparent border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600" 
            placeholder={mode === 'login' ? "ENTER KEY" : "EMAIL ADDRESS"} 
          />
          
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