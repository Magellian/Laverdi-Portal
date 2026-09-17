import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePairingToken } from '@/lib/provisioning/engine'

/**
 * GET /api/agents/[id]/companion/pair — fetch pairing instructions for the
 * local companion app. Issues a pairing token if this instance doesn't
 * have one yet (older instances provisioned before this existed).
 *
 * POST /api/agents/[id]/companion/pair — rotate (invalidate + reissue) the
 * pairing token, e.g. if the customer suspects it leaked or wants to
 * re-pair a different machine.
 *
 * Bones-only for now: the companion app talks to the bridge with this
 * token via the heartbeat endpoint. There is no live push/dispatch yet
 * (that's a later build step) — see hermes-hybrid-companion-design.md.
 */
async function getOwnedInstance(instanceId: string, userId: string) {
  return prisma.instance.findFirst({
    where: { id: instanceId, ownerId: userId },
  })
}

function pairingPayload(instance: { id: string; pairingToken: string | null; companionStatus: string; companionLastSeen: Date | null }) {
  return {
    instanceId: instance.id,
    pairingToken: instance.pairingToken,
    companionStatus: instance.companionStatus,
    companionLastSeen: instance.companionLastSeen,
    // Bones-stage bridge: the companion app polls this endpoint. A real
    // push/WebSocket relay is a later build step, not wired yet.
    heartbeatUrl: `/api/agents/${instance.id}/companion/heartbeat`,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let instance = await getOwnedInstance(id, session.user.id)

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  if (!instance.pairingToken) {
    instance = await prisma.instance.update({
      where: { id },
      data: { pairingToken: generatePairingToken() },
    })
  }

  return NextResponse.json(pairingPayload(instance))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedInstance(id, session.user.id)

  if (!existing) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const instance = await prisma.instance.update({
    where: { id },
    data: {
      pairingToken: generatePairingToken(),
      companionStatus: 'unpaired',
      companionLastSeen: null,
    },
  })

  return NextResponse.json(pairingPayload(instance))
}
