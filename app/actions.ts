// app/actions.ts
'use server'

import { db } from '@/db'
import { accessKeys, accessRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function handleAction(formData: FormData) {
  const actionType = formData.get('actionType') as string
  
  // LOGIK FÜR LOGIN
  if (actionType === 'login') {
    const key = formData.get('accessKey') as string
    if (!key) return { error: 'Bitte Key eingeben.' }

    const result = await db.select().from(accessKeys).where(eq(accessKeys.key, key))
    
    if (result.length > 0 && !result[0].isUsed) {
      await db.update(accessKeys).set({ isUsed: true }).where(eq(accessKeys.key, key))
      redirect('/shop')
    }
    return { error: 'Key ungültig oder bereits benutzt.' }
  }

  // LOGIK FÜR ANFRAGE
  if (actionType === 'request') {
    const email = formData.get('email') as string
    if (!email || !email.includes('@')) return { error: 'Bitte gültige E-Mail eingeben.' }
    
    try {
      // 1. In DB speichern
      await db.insert(accessRequests).values({ 
        email: email,
        status: 'pending' 
      })

      // 2. Mail an dich senden
      await resend.emails.send({
        from: 'Bellator System <onboarding@resend.dev>',
        to: 'bellator.skatewear@gmail.com',
        subject: 'Neue Early Access Anfrage',
        text: `Neue Anfrage von: ${email}`
      })

      return { success: 'Anfrage erhalten! Wir melden uns.' }
    } catch (e) {
      console.error(e)
      return { error: 'Fehler beim Senden der Anfrage.' }
    }
  }
}
