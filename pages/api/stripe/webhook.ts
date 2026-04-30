import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { sendWelcomeEmail, sendReceiptEmail } from '@/lib/email'
import { generateApiKey } from '@/lib/api-key'
import { provisionContainer } from '@/lib/docker-provision'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export const config = {
  api: {
    bodyParser: {
      raw: true,
    },
  },
}

async function handleCheckoutSessionCompleted(event: Stripe.Event, supabaseClientParam: any) {
  const session = event.data.object as Stripe.Checkout.Session

  if (!session.customer || !session.metadata) {
    throw new Error('Missing customer or metadata')
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Get customer email
  const customer = await stripe.customers.retrieve(session.customer as string)
  if ('deleted' in customer) {
    throw new Error('Customer has been deleted')
  }
  const email = customer.email as string

  // Get plan from metadata
  const plan = (session.metadata as any).plan

  // Find or create user
  const { data: users } = await supabaseClientParam
    .from('users')
    .select('*')
    .eq('email', email)

  let userId = users?.[0]?.id

  if (!userId) {
    // Create new user
    const { data: newUser, error: createError } = await supabaseClientParam
      .from('users')
      .insert({
        email,
        tier: plan,
        api_key: generateApiKey(),
      })
      .select()
      .single()

    if (createError) throw createError
    userId = newUser.id
  } else {
    // Update user tier and mark trial as converted
    const { error: updateError } = await supabaseClientParam
      .from('users')
      .update({ 
        tier: plan,
        trial_converted: true,
        trial_expires_at: null  // Cancel trial on upgrade
      })
      .eq('id', userId)

    if (updateError) throw updateError
  }

  // Create subscription record
  const { error: subError } = await supabaseClientParam.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: session.customer as string,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
  })

  if (subError) throw subError

  // Get user data
  const { data: userData } = await supabaseClientParam
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  // Send welcome email with API key
  await sendWelcomeEmail(email, userData.api_key, plan)

  // Provision Docker container
  try {
    console.log(`Starting container provisioning for user ${userId}...`);
    await provisionContainer(userId);
    console.log(`Container provisioning started successfully for ${userId}.`);
  } catch (error) {
    console.error(`Error provisioning container for user ${userId}:`, error);
    // Note: We don't throw here to avoid failing the whole Stripe webhook, 
    // which would cause Stripe to keep retrying. The user has paid, so we should 
    // handle the provisioning failure asynchronously or via admin intervention.
  }

  // Send receipt email
  if (session.amount_total) {
    const invoiceUrl = subscription.latest_invoice
      ? (typeof subscription.latest_invoice === 'string'
          ? subscription.latest_invoice
          : subscription.latest_invoice.hosted_invoice_url)
      : '#'

    await sendReceiptEmail(
      email,
      plan,
      session.amount_total,
      invoiceUrl as string
    )
  }
}

async function handleCustomerSubscriptionUpdated(event: Stripe.Event, supabaseClientParam: any) {
  const subscription = event.data.object as Stripe.Subscription

  // Update subscription status
  const { error } = await supabaseClientParam
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error
}

async function handleCustomerSubscriptionDeleted(event: Stripe.Event, supabaseClientParam: any) {
  const subscription = event.data.object as Stripe.Subscription

  // Update subscription as cancelled
  const { error } = await supabaseClientParam
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[WEBHOOK] Received request, method:', req.method)
  
  if (req.method !== 'POST') {
    console.log('[WEBHOOK] Invalid method, returning 405')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let event: Stripe.Event

  try {
    console.log('[WEBHOOK] Starting signature verification')
    const sig = req.headers['stripe-signature']

    if (!sig || !webhookSecret) {
      console.log('[WEBHOOK] Missing signature or secret')
      return res.status(400).json({ error: 'Missing signature or secret' })
    }

    const body = req.body as Buffer
    console.log('[WEBHOOK] Constructing event from body')
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    console.log('[WEBHOOK] Event constructed successfully, type:', event.type)
  } catch (error: any) {
    console.error('[WEBHOOK] Signature verification failed:', error.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    console.log('[WEBHOOK] Creating Supabase admin client')
    const supabaseClient = createAdminClient()
    console.log('[WEBHOOK] Admin client created')
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('[WEBHOOK] Handling checkout.session.completed')
        await handleCheckoutSessionCompleted(event, supabaseClient)
        console.log('[WEBHOOK] checkout.session.completed handled')
        break
      case 'customer.subscription.updated':
        console.log('[WEBHOOK] Handling customer.subscription.updated')
        await handleCustomerSubscriptionUpdated(event, supabaseClient)
        console.log('[WEBHOOK] customer.subscription.updated handled')
        break
      case 'customer.subscription.deleted':
        console.log('[WEBHOOK] Handling customer.subscription.deleted')
        await handleCustomerSubscriptionDeleted(event, supabaseClient)
        console.log('[WEBHOOK] customer.subscription.deleted handled')
        break
      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }

    console.log('[WEBHOOK] Sending success response')
    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('[WEBHOOK] Handler error:', error.message || error)
    console.error('[WEBHOOK] Full error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
