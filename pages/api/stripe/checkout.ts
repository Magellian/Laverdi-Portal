import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe, createCheckoutSession, createCustomer } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get Supabase admin client
    const supabaseAdmin = createAdminClient()

    // Extract session from Authorization header (sent by client)
    const authHeader = req.headers.authorization
    console.log('DEBUG: Checkout request received')
    console.log('DEBUG: Auth header:', authHeader ? 'present' : 'missing')
    console.log('DEBUG: Body:', JSON.stringify(req.body))
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('DEBUG: No bearer token found')
      return res.status(401).json({ error: 'Unauthorized - no auth header' })
    }

    const token = authHeader.substring(7)

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return res.status(401).json({ error: 'Unauthorized - invalid token' })
    }

    const { planId } = req.body

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' })
    }

    // Check if user has existing subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existingSubscription?.stripe_customer_id

    console.log('DEBUG: Existing customer ID:', customerId)
    console.log('DEBUG: User email:', user.email)
    console.log('DEBUG: User ID:', user.id)

    // Create Stripe customer if needed (or if it's a placeholder/test ID)
    if (!customerId || customerId.includes('free_placeholder')) {
      console.log('DEBUG: No existing customer, creating new one')
      try {
        const customer = await createCustomer(user.email!)
        console.log('DEBUG: Created customer:', customer.id)
        customerId = customer.id
      } catch (err: any) {
        console.error('DEBUG: Error creating customer:', err.message)
        throw err
      }
    } else {
      console.log('DEBUG: Using existing customer:', customerId)
    }

    if (!customerId) {
      return res.status(500).json({ error: 'Failed to create or retrieve customer' })
    }

    console.log('DEBUG: Final customer ID to use:', customerId)

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await createCheckoutSession(
      customerId,
      planId,
      `${appUrl}/checkout/success`
    )

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return res
      .status(500)
      .json({ error: error.message || 'Internal server error' })
  }
}
