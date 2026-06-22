// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isShopPage = request.nextUrl.pathname.startsWith('/shop');
  const hasKey = request.cookies.has('bellator-access');

  if (isShopPage && !hasKey) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*'], // Schützt alles unter /shop
};