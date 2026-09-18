import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDelegationKillSwitchActive } from '@/lib/kill-switch'

const VALID_POLICIES = new Set(['ask', 'auto_trusted', 'auto_all', 'server_only'])

/**
 * GET /api/agents/[id]/companion/status — status for the dashboard
 * (companion pairing state + recent delegated-job audit trail).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const instance = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      companionStatus: true,
      companionLastSeen: true,
      delegationPolicy: true,
      delegatedJobs: {
        orderBy: { requestedAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...instance,
    delegationKillSwitchActive: await isDelegationKillSwitchActive(),
  })
}

/**
 * PATCH /api/agents/[id]/companion/status — update this instance's
 * delegation policy from the dashboard.
 * Body: { delegationPolicy: 'ask'|'auto_trusted'|'auto_all'|'server_only' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.instance.findFirst({ where: { id, ownerId: session.user.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { delegationPolicy } = body as { delegationPolicy?: string }
  if (!delegationPolicy || !VALID_POLICIES.has(delegationPolicy)) {
    return NextResponse.json(
      { error: `delegationPolicy must be one of ${[...VALID_POLICIES].join(', ')}` },
      { status: 400 }
    )
  }

  const instance = await prisma.instance.update({
    where: { id },
    data: { delegationPolicy },
    select: {
      id: true,
      companionStatus: true,
      companionLastSeen: true,
      delegationPolicy: true,
      delegatedJobs: { orderBy: { requestedAt: 'desc' }, take: 20 },
    },
  })

  return NextResponse.json(instance)
}
