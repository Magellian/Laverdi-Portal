import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

// Flag accounts that have spent more than this many credits in the window
// -- a rough first-pass abuse signal (see Open questions in the scoping
// doc: this is the "set up an admin monitor" piece, deliberately simple).
const ABUSE_THRESHOLD_CREDITS = 300

/**
 * GET /api/admin/credits — Credit spend per user over a window, flags
 * accounts over ABUSE_THRESHOLD_CREDITS. 'hold' transactions are what
 * actually spend credits (charge is a 0-amount marker), so sum those.
 * Query: ?days=1 (default, matches "last 24h" framing in the UI)
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { searchParams } = new URL(request.url)
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '1', 10) || 1))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const holds = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: { type: 'hold', createdAt: { gte: since } },
    _sum: { amount: true },
    _count: { _all: true },
  })

  const userIds = holds.map((h) => h.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const balances = await prisma.creditBalance.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, balance: true },
  })
  const balanceMap = new Map(balances.map((b) => [b.userId, b.balance]))

  const rows = holds
    .map((h) => {
      const spent = Math.abs(h._sum.amount || 0)
      return {
        userId: h.userId,
        email: userMap.get(h.userId)?.email ?? null,
        name: userMap.get(h.userId)?.name ?? null,
        creditsSpent: spent,
        jobCount: h._count._all,
        currentBalance: balanceMap.get(h.userId) ?? 0,
        flagged: spent > ABUSE_THRESHOLD_CREDITS,
      }
    })
    .sort((a, b) => b.creditsSpent - a.creditsSpent)

  return NextResponse.json({
    days,
    threshold: ABUSE_THRESHOLD_CREDITS,
    totalCreditsSpent: rows.reduce((acc, r) => acc + r.creditsSpent, 0),
    flaggedCount: rows.filter((r) => r.flagged).length,
    rows,
  })
}
