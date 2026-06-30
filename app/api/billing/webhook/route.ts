import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, getTierFromPriceId } from '@/lib/stripe'
import { provisionAgent } from '@/lib/provisioning/engine'
import { sendWelcomeEmail } from '@/lib/email'

/** Safely extract period dates from a Stripe subscription object */
function extractPeriodDates(sub: any): {
  periodStart: Date | null
  periodEnd: Date | null
} {
  const start = sub.current_period_start
  const end = sub.current_period_end
  return {
    periodStart: typeof start === 'number' ? new Date(start * 1000) : null,
    periodEnd: typeof end === 'number' ? new Date(end * 1000) : null,
  }
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  if (!sig || !endpointSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`✓ Checkout completed: ${session.id}`)

        const customerEmail = session.customer_email || session.customer_details?.email
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!customerEmail || !subscriptionId) {
          console.error('Missing email or subscription ID from checkout session')
          break
        }

        // Fetch full subscription details from Stripe
        const subResponse = await stripe.subscriptions.retrieve(subscriptionId)
        const sub = subResponse as unknown as Stripe.Subscription
        const priceId = sub.items.data[0]?.price?.id || ''
        const tier = getTierFromPriceId(priceId)

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email: customerEmail } })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: customerEmail,
              stripeCustomerId: customerId,
            },
          })
          console.log(`  Created user: ${user.id} (${customerEmail})`)
        } else if (!user.stripeCustomerId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId },
          })
        }

        // Create subscription record
        const { periodStart, periodEnd } = extractPeriodDates(sub)
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            status: sub.status,
            tier,
            stripePriceId: priceId,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          create: {
            userId: user.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            tier,
            status: sub.status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })

        console.log(`  Subscription ${subscriptionId} → tier: ${tier}, status: ${sub.status}`)

        // Auto-provision first agent for new subscribers
        if (sub.status === 'active' || sub.status === 'trialing') {
          const existingAgents = await prisma.instance.count({
            where: { ownerId: user.id, status: { in: ['provisioning', 'running'] } },
          })

          if (existingAgents === 0) {
            const provisionResult = await provisionAgent(user.id, tier)
            console.log(`  Auto-provisioned agent: ${provisionResult.instanceId} (${provisionResult.status})`)

            // Send welcome email with API key
            if (customerEmail) {
              const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
              await sendWelcomeEmail(customerEmail, tierName, provisionResult.apiKey)
            }
          }
        }

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price?.id || ''
        const tier = getTierFromPriceId(priceId)

        const { periodStart: updStart, periodEnd: updEnd } = extractPeriodDates(sub)
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            tier,
            stripePriceId: priceId,
            currentPeriodStart: updStart,
            currentPeriodEnd: updEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })

        console.log(`✓ Subscription updated: ${sub.id} → ${sub.status} (${tier})`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'canceled' },
        })

        console.log(`✓ Subscription cancelled: ${sub.id}`)
        // TODO: Schedule container teardown (WP3)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        if (subscriptionId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: 'past_due' },
          })
          console.log(`⚠ Payment failed for subscription: ${subscriptionId}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
