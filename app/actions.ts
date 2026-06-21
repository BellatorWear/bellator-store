'use server'

import { db } from '@/db'
import { accessKeys, accessRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function handleAction(formData: FormData) {
  const actionType = formData.get('actionType') as string
  
  if (actionType === 'login') {
    const key = formData.get('accessKey') as string
    if (!key) return { error: 'Bitte Key eingeben.' }

    // DB Abfrage
    const result = await db.select().from(accessKeys).where(eq(accessKeys.key, key))
    
    // Validierung
    if (result.length > 0 && !result[0].isUsed) {
      await db.update(accessKeys).set({ isUsed: true }).where(eq(accessKeys.key, key))
      
      // Cookie setzen
      const cookieStore = await cookies()
      cookieStore.set('bellator_access', 'true', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/' 
      })

      // ERFOLG zurückgeben statt redirect()
      return { success: true }
    }
    
    return { error: 'Key ungültig oder bereits benutzt.' }
  }

  if (actionType === 'request') {
    const email = formData.get('email') as string
    if (!email || !email.includes('@')) return { error: 'Bitte gültige E-Mail eingeben.' }
    
    try {
      await db.insert(accessRequests).values({ email, status: 'pending' })
      await resend.emails.send({
        from: 'Bellator System <onboarding@resend.dev>',
        to: 'bellator.skatewear@gmail.com',
        subject: 'Neue Early Access Anfrage',
        text: `Anfrage von: ${email}`
      })
      return { success: 'Anfrage erhalten!' }
    } catch (e) {
      return { error: 'Fehler beim Senden.' }
    }
  }
}
