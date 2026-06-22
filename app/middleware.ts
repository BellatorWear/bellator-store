import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Schütze alle Pfade, die mit /shop beginnen
  if (request.nextUrl.pathname.startsWith('/shop')) {
    const authCookie = request.cookies.get('bellator-access')
    
    // Wenn kein Cookie da ist, schick den User zum Login (Root)
    if (!authCookie) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/shop/:path*'],
}