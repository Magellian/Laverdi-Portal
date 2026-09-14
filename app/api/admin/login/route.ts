import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { signAdminToken, COOKIE_NAME, TOKEN_TTL } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    // Still run a comparison of equal length to avoid leaking length via timing.
    crypto.timingSafeEqual(aBuf, aBuf)
    return false
  }
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function POST(request: Request) {
  // Admin login guards the whole platform — limit brute-force attempts per IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = rateLimit(`admin-login:${ip}`, 5, 60000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 })
  }

  const { password } = await request.json()
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }
  if (!process.env.ADMIN_PASSWORD || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, signAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL,
  })
  return response
}
