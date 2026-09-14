import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'

/**
 * GET /api/admin/users/[id] — Full user detail: subscriptions, instances,
 * and usage summary (total tokens per model).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      stripeCustomerId: true,
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tier: true,
          status: true,
          stripeSubscriptionId: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
        },
      },
      instances: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          port: true,
          tier: true,
          modelPrimary: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Usage summary — total tokens grouped by model
  const usageByModel = await prisma.inferenceUsage.groupBy({
    by: ['model'],
    where: { userId: id },
    _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
  })

  const usage = usageByModel.map((u) => ({
    model: u.model,
    totalTokens: u._sum.totalTokens ?? 0,
    promptTokens: u._sum.promptTokens ?? 0,
    completionTokens: u._sum.completionTokens ?? 0,
  }))

  const totalTokens = usage.reduce((acc, u) => acc + u.totalTokens, 0)

  return NextResponse.json({ user, usage, totalTokens })
}

/**
 * PATCH /api/admin/users/[id] — Update a user's subscription.
 * Body: { cancelAtPeriodEnd?: boolean, tier?: string }
 * Applies to the user's most recent subscription. When cancelAtPeriodEnd is
 * provided and the subscription has a Stripe ID, the change is mirrored to Stripe.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const subscription = await prisma.subscription.findFirst({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) {
    return NextResponse.json(
      { error: 'No subscription found for this user' },
      { status: 404 }
    )
  }

  const data: Record<string, any> = {}
  if (typeof body.cancelAtPeriodEnd === 'boolean') {
    data.cancelAtPeriodEnd = body.cancelAtPeriodEnd
  }
  if (typeof body.tier === 'string' && body.tier) {
    data.tier = body.tier
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Mirror cancelAtPeriodEnd to Stripe when possible
  if (
    typeof body.cancelAtPeriodEnd === 'boolean' &&
    subscription.stripeSubscriptionId &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: body.cancelAtPeriodEnd,
      })
    } catch (err) {
      console.error(`Stripe update failed for ${subscription.stripeSubscriptionId}:`, err)
      // Continue — still persist the intent in our DB
    }
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data,
  })

  return NextResponse.json({ subscription: updated })
}
