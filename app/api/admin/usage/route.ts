import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * GET /api/admin/usage — Inference usage analytics.
 * Query: ?userId=  ?days=30
 * Returns: totalTokens, per-model breakdown, top users by usage.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || undefined
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30))

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const where = {
    timestamp: { gte: since },
    ...(userId ? { userId } : {}),
  }

  // Per-model breakdown
  const byModel = await prisma.inferenceUsage.groupBy({
    by: ['model'],
    where,
    _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
  })

  const modelBreakdown = byModel
    .map((m) => ({
      model: m.model,
      totalTokens: m._sum.totalTokens ?? 0,
      promptTokens: m._sum.promptTokens ?? 0,
      completionTokens: m._sum.completionTokens ?? 0,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens)

  const totalTokens = modelBreakdown.reduce((acc, m) => acc + m.totalTokens, 0)

  // Top users by usage
  const byUser = await prisma.inferenceUsage.groupBy({
    by: ['userId'],
    where,
    _sum: { totalTokens: true },
    orderBy: { _sum: { totalTokens: 'desc' } },
    take: 10,
  })

  const userIds = byUser.map((u) => u.userId)
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const topUsers = byUser.map((u) => ({
    userId: u.userId,
    email: userMap.get(u.userId)?.email ?? null,
    name: userMap.get(u.userId)?.name ?? null,
    totalTokens: u._sum.totalTokens ?? 0,
  }))

  return NextResponse.json({
    days,
    userId: userId ?? null,
    totalTokens,
    modelBreakdown,
    topUsers,
  })
}
