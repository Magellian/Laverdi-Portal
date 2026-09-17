import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * POST /api/agents/[id]/companion/heartbeat — called by the local
 * companion app (not the customer's browser session), authenticated by
 * the instance's pairing token in the request body.
 *
 * Bones-only: this just proves liveness and flips companionStatus to
 * 'paired'. It carries no work yet — actual delegated-job dispatch is a
 * later build step (see hermes-hybrid-companion-design.md, section 6).
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

  return NextResponse.json({
    status: 'ok',
    delegationPolicy: instance.delegationPolicy,
    // Bones-only: an empty queue for now. A later step will return
    // pending DelegatedJob rows here for the companion to act on.
    pendingJobs: [],
  })
}
