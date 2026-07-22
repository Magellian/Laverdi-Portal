import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Guard for admin API routes. Returns a NextResponse error if the caller is
 * not authenticated (401) or not an admin (403), otherwise returns the session.
 *
 * Usage:
 *   const guard = await requireAdmin()
 *   if (guard instanceof NextResponse) return guard
 *   const session = guard
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return session
}
