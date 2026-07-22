import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * GET /api/admin/users — List all users with subscription + agent count.
 * Query: ?search=  ?page=1  ?limit=20
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { tier: true, status: true },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
    }),
  ])

  const data = users.map((u) => {
    const sub = u.subscriptions[0]
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      tier: sub?.tier ?? null,
      status: sub?.status ?? null,
      agentCount: u._count.instances,
    }
  })

  return NextResponse.json({
    users: data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}
