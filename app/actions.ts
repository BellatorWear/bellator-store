'use server'

import { db } from '@/db'
import { accessKeys } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

// Wir definieren einen Rückgabetyp, den das Frontend garantiert versteht
type ActionResponse = {
  success?: string | boolean;
  error?: string;
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function handleAction(formData: FormData): Promise<ActionResponse> {
  const actionType = formData.get('actionType') as string

  if (actionType === 'login') {
    const key = formData.get('accessKey') as string
    const result = await db.select().from(accessKeys).where(eq(accessKeys.key, key))
    
    if (result.length > 0) {
      return { success: true }
    }
    return { error: 'Invalid Access Key' }
  }

  if (actionType === 'request') {
    const email = formData.get('email') as string
    
    if (!resend) {
      return { error: 'E-Mail Dienst nicht konfiguriert.' }
    }

    try {
      await resend.emails.send({
        from: 'Bellator <noreply@bellator.store>',
        to: email,
        subject: 'Access Requested',
        text: 'Deine Anfrage für den Bellator Store wurde erhalten.'
      })
      return { success: 'Anfrage erhalten!' }
    } catch (e) {
      return { error: 'Fehler beim Senden der E-Mail.' }
    }
  }

  return { error: 'Ungültige Aktion.' }
}
