import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/agents/[id]/telegram — Connect Telegram bot to agent
 * Body: { botToken: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { botToken } = body

  if (!botToken || !botToken.includes(':')) {
    return NextResponse.json(
      { error: 'Invalid bot token. It should look like 123456789:ABCdefGHI...' },
      { status: 400 }
    )
  }

  // Verify ownership
  const instance = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Call provisioner to add Telegram
  const provisionerUrl = process.env.PROVISIONER_URL || 'http://127.0.0.1:9090'
  const secret = process.env.PROVISION_CALLBACK_SECRET || 'laverdi-callback-xK9m-2026'

  try {
    const res = await fetch(`${provisionerUrl}/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        instanceId: id,
        botToken,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.error || 'Failed to connect Telegram' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Telegram bot connected! Send a message to your bot to start chatting.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Provisioner unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
