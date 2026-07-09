import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { provisionAgent, callProvisioner } from '@/lib/provisioning/engine'
import { getTierLimits } from '@/lib/stripe'

/**
 * Mark instances stuck in 'provisioning' for more than 5 minutes as 'error'.
 * This prevents agents from being stuck forever if the provisioner fails.
 */
async function markStuckInstancesAsError(userId: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const stuck = await prisma.instance.findMany({
    where: {
      ownerId: userId,
      status: 'provisioning',
      updatedAt: { lt: fiveMinutesAgo },
    },
  })
  for (const instance of stuck) {
    await prisma.instance.update({
      where: { id: instance.id },
      data: { status: 'error' },
    })
    console.log(`Marked instance ${instance.id} as error (stuck provisioning >5min)`)
  }
}

/**
 * GET /api/agents — List user's agent instances with tier limit info
 */
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for stuck provisioning instances (>5 min → error)
  await markStuckInstancesAsError(session.user.id)

  const [instances, subscription] = await Promise.all([
    prisma.instance.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        port: true,
        tier: true,
        modelPrimary: true,
        modelFallback: true,
        telegramBotToken: true,
        discordBotToken: true,
        slackBotToken: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'trialing'] },
      },
      select: { tier: true },
    }),
  ])

  const tier = subscription?.tier || 'starter'
  const limits = getTierLimits(tier)
  const activeCount = instances.filter((i) =>
    ['provisioning', 'running'].includes(i.status)
  ).length

  const instancesWithFlags = instances.map((i) => ({
    ...i,
    hasTelegram: !!i.telegramBotToken,
    hasDiscord: !!i.discordBotToken,
    hasSlack: !!i.slackBotToken,
    telegramBotToken: undefined,
    discordBotToken: undefined,
    slackBotToken: undefined,
  }))

  return NextResponse.json({
    instances: instancesWithFlags,
    tier,
    maxAgents: limits.maxAgents,
    agentCount: activeCount,
  })
}

/**
 * POST /api/agents — Provision a new agent instance
 * Body: { name?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['active', 'trialing'] },
    },
  })

  if (!subscription) {
    return NextResponse.json(
      { error: 'Active subscription required. Please subscribe first.' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const name = body.name || null

  const result = await provisionAgent(session.user.id, subscription.tier)

  if (result.status === 'error') {
    const status = result.errorType === 'limit_reached' ? 403 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  // Update name if provided
  if (name) {
    await prisma.instance.update({
      where: { id: result.instanceId },
      data: { name },
    })
  }

  // Call provisioner to actually start the Hermes instance
  const provisionResult = await callProvisioner({
    id: result.instanceId,
    port: result.port,
    tier: subscription.tier,
    pairingToken: result.pairingToken,
  })

  return NextResponse.json({
    instanceId: result.instanceId,
    port: result.port,
    apiKey: result.apiKey,
    status: provisionResult ? 'running' : 'provisioning',
    dashboardUrl: provisionResult?.dashboard_url || null,
    dashboardPassword: provisionResult?.dashboard_password || null,
    message: provisionResult
      ? 'Agent is live! Open the dashboard to get started.'
      : 'Agent is being provisioned. It will be available in 1-2 minutes.',
  }, { status: 201 })
}
