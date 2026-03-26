//This is to run auth check before redirecting user to router

//Named this proxy.ts to avoid confusion with middleware.ts helper file in supabase

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

//Middleware specific constants (local)
const PUBLIC_PATHS = new Set(['/login', '/register', '/auth/callback'])

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/auth/')
}

export async function proxy(request: NextRequest) {
  // Refresh the supabase session cookie  
  // This is to refresh cookie every time user sends a HTTP request
  // It will extend the cookie expiry, ensuring users don't need to relogin constantly so user stays logged in as long as they are active
  const { supabaseResponse, user } = await updateSession(request)
  
  //HTTP request URL
  const { pathname } = request.nextUrl

  // API routes: always pass through — route handlers manage their own auth
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Authenticated users visiting login/register -> send to closet
  if (user && isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/closet'
    return NextResponse.redirect(url)
  }

  // Unauthenticated users visiting protected routes -> send to login
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

//Middleware runs on every request by default, which is slow for static files
//Therefore exclude them
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static image files
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
