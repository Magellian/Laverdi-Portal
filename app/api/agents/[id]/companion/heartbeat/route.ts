import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { isDelegationKillSwitchActive } from '@/lib/kill-switch'

/**
 * POST /api/agents/[id]/companion/heartbeat — called by the local
 * companion app (not the customer's browser session), authenticated by
 * the instance's pairing token in the request body.
 *
 * Also returns any DelegatedJob rows the sandboxed instance has queued up
 * via /api/agents/[id]/companion/jobs and that are ready for the companion
 * to act on (status='approved'). Jobs still at status='pending' are
 * awaiting human approval (dashboard UI is a later step) and are not sent.
 *
 * Known bones-stage limitation: there's no claim/lease step, so an
 * approved job keeps showing up in pendingJobs on every heartbeat until
 * the companion posts a result for it via .../jobs/[jobId]/result.
 *
 * Also checks the global delegation kill switch (lib/kill-switch.ts) —
 * when it's on, pendingJobs is always empty regardless of what's
 * actually approved in the DB.
 */
function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { pairingToken } = body as { pairingToken?: string }

  if (!pairingToken) {
    return NextResponse.json({ error: 'pairingToken required' }, { status: 400 })
  }

  const instance = await prisma.instance.findUnique({ where: { id } })

  if (!instance || !instance.pairingToken || !tokensMatch(pairingToken, instance.pairingToken)) {
    return NextResponse.json({ error: 'Invalid pairing token' }, { status: 401 })
  }

  await prisma.instance.update({
    where: { id },
    data: {
      companionStatus: 'paired',
      companionLastSeen: new Date(),
    },
  })

  // Defense in depth: even a job that was approved before the kill switch
  // was flipped on stays hidden from every companion until it's off again.
  const killSwitchActive = await isDelegationKillSwitchActive()

  const jobs = killSwitchActive
    ? []
    : await prisma.delegatedJob.findMany({
        where: { instanceId: id, status: 'approved' },
        orderBy: { requestedAt: 'asc' },
        take: 10,
      })

  return NextResponse.json({
    status: 'ok',
    delegationPolicy: instance.delegationPolicy,
    pendingJobs: jobs.map((j) => ({
      id: j.id,
      kind: j.kind,
      payload: j.payload ? JSON.parse(j.payload) : null,
    })),
  })
}
