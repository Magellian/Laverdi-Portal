import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startVideoGeneration } from '@/app/api/agents/[id]/companion/jobs/route'

/**
 * POST /api/agents/[id]/companion/jobs/[jobId]/approve — dashboard action.
 * Moves a job sitting at 'pending' (delegationPolicy='ask') to 'approved'
 * so it's included in the paired companion's next heartbeat.
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

  await prisma.delegatedJob.update({
    where: { id: jobId },
    data: { approvedBy: session.user.id },
  })

  // render_job + video: approving doesn't just flip the status -- it's the
  // moment we actually call the provider (never before approval, so a
  // denied job never costs anything). startVideoGeneration sets the final
  // status itself (approved on success, failed + credit refund on error).
  if (job.kind === 'render_job') {
    let parsed: { mediaType?: string; prompt?: string; durationSeconds?: number; mediaJobId?: string } = {}
    try {
      parsed = job.payload ? JSON.parse(job.payload) : {}
    } catch {
      // fall through -- treated as malformed below
    }
    if (parsed.mediaType === 'video' && parsed.mediaJobId && parsed.prompt) {
      await startVideoGeneration(parsed.mediaJobId, jobId, parsed.prompt, parsed.durationSeconds || 5)
      const refreshed = await prisma.delegatedJob.findUnique({ where: { id: jobId } })
      return NextResponse.json(refreshed)
    }
  }

  const updated = await prisma.delegatedJob.update({
    where: { id: jobId },
    data: { status: 'approved' },
  })

  return NextResponse.json(updated)
}
