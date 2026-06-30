import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { teardownInstance } from '@/lib/provisioning/engine'

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

  const containerName = await teardownInstance(id)

  return NextResponse.json({
    message: 'Agent scheduled for teardown',
    containerName,
  })
}
