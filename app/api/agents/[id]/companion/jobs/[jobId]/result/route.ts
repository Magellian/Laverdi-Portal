import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = new Set(['completed', 'failed'])

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * POST /api/agents/[id]/companion/jobs/[jobId]/result — Called by the
 * local companion app once it has run (or failed to run) a job it picked
 * up from its heartbeat's pendingJobs. Authenticated the same way as the
 * heartbeat itself: the instance's pairing token, since the companion has
 * no user session.
 *
 * Body: { pairingToken: string, status: 'completed'|'failed', resultSummary?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id, jobId } = await params
  const body = await request.json().catch(() => ({}))
  const { pairingToken, status, resultSummary } = body as {
    pairingToken?: string
    status?: string
    resultSummary?: string
  }

  if (!pairingToken) {
    return NextResponse.json({ error: 'pairingToken required' }, { status: 400 })
  }
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: `status must be one of ${[...VALID_STATUSES].join(', ')}` }, { status: 400 })
  }

  const instance = await prisma.instance.findUnique({ where: { id } })
  if (!instance || !instance.pairingToken || !tokensMatch(pairingToken, instance.pairingToken)) {
    return NextResponse.json({ error: 'Invalid pairing token' }, { status: 401 })
  }

  const job = await prisma.delegatedJob.findFirst({ where: { id: jobId, instanceId: id } })
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  await prisma.delegatedJob.update({
    where: { id: jobId },
    data: { status, resultSummary: resultSummary?.slice(0, 4000) ?? null },
  })
  await prisma.instance.update({
    where: { id },
    data: { companionStatus: 'paired', companionLastSeen: new Date() },
  })

  return NextResponse.json({ status: 'ok' })
}
