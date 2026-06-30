import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/agents/[id] — Get agent instance details
 */
export async function GET(
  _request: NextRequest,
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
      name: true,
      status: true,
      port: true,
      tier: true,
      modelPrimary: true,
      modelFallback: true,
      apiKey: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json({ instance })
}

/**
 * PATCH /api/agents/[id] — Update agent (name, model config)
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
  const body = await request.json()

  // Verify ownership
  const existing = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const updateData: Record<string, any> = {}
  if (body.name !== undefined) updateData.name = body.name

  const updated = await prisma.instance.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ instance: updated })
}

/**
 * DELETE /api/agents/[id] — Tear down and remove agent
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const existing = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Call provisioner to tear down the running Hermes instance
  const provisionerUrl = process.env.PROVISIONER_URL || 'http://127.0.0.1:9090'
  const secret = process.env.PROVISION_CALLBACK_SECRET || 'laverdi-callback-xK9m-2026'

  try {
    const res = await fetch(`${provisionerUrl}/teardown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ instanceId: id }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`Provisioner teardown error for ${id}: ${JSON.stringify(err)}`)
      // Fall through — still clean up the DB record
    }
  } catch (err) {
    // Provisioner may be unreachable; still clean up DB
    console.error(`Failed to reach provisioner for teardown of ${id}: ${err}`)
  }

  // Mark instance as stopped in DB
  await prisma.instance.update({
    where: { id },
    data: { status: 'stopped' },
  })

  return NextResponse.json({ message: 'Agent deleted' })
}
