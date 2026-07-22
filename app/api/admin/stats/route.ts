import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * GET /api/admin/stats — Platform-wide stats for the admin overview.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    activeSubscriptions,
    trialSubscriptions,
    totalAgents,
    newSignupsThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'trialing' } }),
    prisma.instance.count({ where: { status: { in: ['provisioning', 'running'] } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
  ])

  return NextResponse.json({
    totalUsers,
    activeSubscriptions,
    trialSubscriptions,
    totalAgents,
    newSignupsThisMonth,
  })
}
