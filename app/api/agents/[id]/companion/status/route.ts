import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/agents/[id]/companion/status — read-only status for the
 * dashboard (companion pairing state + recent delegated-job audit trail).
 * Bones-only: no UI consumes this yet (that's a later build step).
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

  return NextResponse.json(instance)
}
