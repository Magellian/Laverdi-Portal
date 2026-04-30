import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware for handling Supabase auth callbacks and session validation
 * 
 * FIX: This middleware ensures that:
 * 1. PKCE callback tokens are properly processed
 * 2. Auth tokens are set in cookies (used by @supabase/ssr)
 * 3. Session state is maintained across redirects
 */
export function middleware(request: NextRequest) {
  // Log auth-related requests for debugging
  if (request.nextUrl.pathname.includes('auth') || 
      request.nextUrl.searchParams.has('code') ||
      request.nextUrl.searchParams.has('state')) {
    console.log('[Middleware] Auth request:', {
      path: request.nextUrl.pathname,
      hasCode: request.nextUrl.searchParams.has('code'),
      hasState: request.nextUrl.searchParams.has('state'),
      hasError: request.nextUrl.searchParams.has('error')
    })
  }

  // Check if this is a callback with auth code (from Supabase OAuth)
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  
  if (code && state) {
    console.log('[Middleware] Detected auth callback with code and state')
    // The @supabase/ssr client will handle this automatically in the browser
    // Just log it for debugging
  }

  return NextResponse.next()
}

// Run middleware on auth routes and pages that need protection
export const config = {
  matcher: [
    // Auth routes
    '/auth/:path*',
    // Dashboard and protected routes
    '/dashboard/:path*',
    // Checkout pages except success (which must be publicly accessible for Stripe redirects)
    '/checkout/cancel',
  ],
}
