import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTierLimits } from '@/lib/stripe'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['active', 'trialing'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) {
    return Response.json({
      plan: null,
      status: 'none',
      currentPeriodEnd: null,
      usage: { agents: 0, maxAgents: 0, channels: 0, maxChannels: 0 },
    })
  }

  const limits = getTierLimits(subscription.tier)

  // Count active instances
  const agentCount = await prisma.instance.count({
    where: {
      ownerId: session.user.id,
      status: { in: ['provisioning', 'running'] },
    },
  })

  return Response.json({
    plan: subscription.tier,
    planName: limits.name,
    price: limits.price,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    usage: {
      agents: agentCount,
      maxAgents: limits.maxAgents,
      channels: 0, // TODO: count connected channels
      maxChannels: limits.maxChannels,
    },
  })
}
