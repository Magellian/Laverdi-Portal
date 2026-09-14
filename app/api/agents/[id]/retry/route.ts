import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callProvisioner } from '@/lib/provisioning/engine'

/**
 * POST /api/agents/[id]/retry — Retry provisioning for a stuck or failed agent.
 * Resets status to 'provisioning' and re-calls the provisioner.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const instance = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Only allow retry for provisioning or error states
  if (!['provisioning', 'error'].includes(instance.status)) {
    return NextResponse.json(
      { error: `Cannot retry agent in '${instance.status}' state` },
      { status: 400 }
    )
  }

  // Reset to provisioning
  await prisma.instance.update({
    where: { id },
    data: { status: 'provisioning' },
  })

  // Re-call provisioner
  const provisionResult = await callProvisioner({
    id: instance.id,
    port: instance.port || 0,
    tier: instance.tier || 'starter',
    pairingToken: instance.pairingToken || '',
  })

  if (provisionResult) {
    return NextResponse.json({
      status: 'running',
      message: 'Agent is live! Open the dashboard to get started.',
    })
  }

  return NextResponse.json({
    status: 'provisioning',
    message: 'Retry initiated. Agent will be available in 1-2 minutes.',
  })
}
