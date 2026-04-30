import Stripe from 'stripe'
import { PRICING_PLANS } from './pricing'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function createCheckoutSession(
  customerId: string,
  planId: string,
  returnUrl: string
) {
  const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS]

  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`)
  }

  if (planId === 'enterprise') {
    throw new Error('Enterprise plan requires manual setup')
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.id,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: {
      plan: planId,
    },
    subscription_data: {
      metadata: {
        plan: planId,
      },
    },
  })

  return session
}

export async function createCustomer(email: string) {
  const customer = await stripe.customers.create({
    email,
  })
  return customer
}

export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}
