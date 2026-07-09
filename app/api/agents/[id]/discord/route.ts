import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/agents/[id]/discord — Connect Discord bot to agent
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

  if (!botToken || botToken.trim().length < 20) {
    return NextResponse.json(
      { error: 'Invalid bot token. Copy the full token from the Bot tab of your Discord application.' },
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

  await prisma.instance.update({
    where: { id },
    data: { discordBotToken: botToken },
  })

  return NextResponse.json({
    status: 'connected',
    message: 'Discord bot connected! Invite it to your server to start chatting.',
  })
}
