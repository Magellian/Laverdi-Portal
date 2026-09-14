import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/agents/[id]/slack — Connect Slack bot to agent
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

  if (!botToken || !botToken.startsWith('xoxb-')) {
    return NextResponse.json(
      { error: 'Invalid bot token. It should look like xoxb-...' },
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
    data: { slackBotToken: botToken },
  })

  return NextResponse.json({
    status: 'connected',
    message: 'Slack bot connected! Message it in your workspace to start chatting.',
  })
}
