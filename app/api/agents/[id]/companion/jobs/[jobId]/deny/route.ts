import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/agents/[id]/companion/jobs/[jobId]/deny — dashboard action.
 * Moves a job sitting at 'pending' (delegationPolicy='ask') to 'denied' so
 * it's never sent to the companion and the sandbox's poll (hermes-delegate)
 * times out rather than hanging indefinitely.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, jobId } = await params
  const instance = await prisma.instance.findFirst({ where: { id, ownerId: session.user.id } })
  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const job = await prisma.delegatedJob.findFirst({ where: { id: jobId, instanceId: id } })
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (job.status !== 'pending') {
    return NextResponse.json({ error: `Job is '${job.status}', not 'pending'` }, { status: 409 })
  }

  const updated = await prisma.delegatedJob.update({
    where: { id: jobId },
    data: { status: 'denied', approvedBy: session.user.id },
  })

  return NextResponse.json(updated)
}
