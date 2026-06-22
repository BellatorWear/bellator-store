'use server'

import { db } from '@/db'
import { accessKeys, accessRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { cookies } from 'next/headers'

type ActionResponse = {
  success?: string | boolean;
  error?: string;
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function handleAction(formData: FormData): Promise<ActionResponse> {
  const actionType = formData.get('actionType') as string

  // --- LOGIN LOGIK ---
  if (actionType === 'login') {
    const key = formData.get('accessKey') as string
    
    const result = await db.select().from(accessKeys).where(eq(accessKeys.key, key))
    
    if (result.length > 0) {
      await db.delete(accessKeys).where(eq(accessKeys.key, key))
      
      // Cookie setzen für den Zugriffsschutz
      const cookieStore = await cookies()
      cookieStore.set('bellator-access', 'authorized', {
        maxAge: 60 * 60 * 24 * 7, // 7 Tage gültig
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
      
      return { success: true }
    }
    
    return { error: 'Invalid Access Key' }
  }

  // --- REQUEST LOGIK ---
  if (actionType === 'request') {
    const email = formData.get('email') as string
    
    if (!resend) {
      return { error: 'E-Mail Dienst nicht konfiguriert.' }
    }

    try {
      await db.insert(accessRequests).values({ 
        email: email,
        status: 'pending'
      });

      await resend.emails.send({
        from: 'Bellator <noreply@bellator.store>',
        to: email,
        subject: 'Access Requested',
        text: 'Deine Anfrage für den Bellator Store wurde erhalten.'
      })
      
      return { success: 'Anfrage erhalten!' }
    } catch (e) {
      console.error("Fehler beim Request:", e);
      return { error: 'Fehler beim Speichern oder Senden.' }
    }
  }

  // --- WARENKORB LOGIK ---
  if (actionType === 'addToCart') {
    const productId = formData.get('productId') as string
    const cookieStore = await cookies()
    const cart = cookieStore.get('cart')?.value
    const cartItems = cart ? JSON.parse(cart) : []
    
    cartItems.push(productId)
    
    cookieStore.set('cart', JSON.stringify(cartItems), { 
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true 
    })
    
    return { success: true }
  }

  return { error: 'Ungültige Aktion.' }
}