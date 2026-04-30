/**
 * Confirm upgrade endpoint
 * Called from checkout success page to manually trigger tier upgrade
 * This bypasses the webhook and directly updates the user tier
 * 
 * GET /api/checkout/confirm-upgrade?sessionId=cs_test_...&email=user@example.com
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { provisionContainer } from '@/lib/docker-provision'

type ResponseData = {
  success: boolean
  message?: string
  error?: string
  redirectUrl?: string
  email?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[ConfirmUpgrade] Handler called, method:', req.method, 'query:', req.query)
  
  if (req.method !== 'GET') {
    console.log('[ConfirmUpgrade] Invalid method')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { sessionId } = req.query

  if (!sessionId) {
    console.log('[ConfirmUpgrade] Missing sessionId')
    return res.status(400).json({ 
      success: false, 
      error: 'Missing sessionId' 
    })
  }

  try {
    console.log('[ConfirmUpgrade] Getting Stripe session:', sessionId)
    
    // Get the Stripe checkout session to extract customer email
    const session = await stripe.checkout.sessions.retrieve(sessionId as string)
    console.log('[ConfirmUpgrade] Session retrieved:', { 
      id: session.id, 
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      customer: session.customer
    })
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Checkout session not found' 
      })
    }

    // Only proceed if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('[ConfirmUpgrade] Payment not paid, status:', session.payment_status)
      return res.status(400).json({ 
        success: false, 
        error: `Payment status: ${session.payment_status}` 
      })
    }

    // Get email from Stripe session
    let email = session.customer_email
    
    if (!email && session.customer) {
      // If no email in session, fetch from customer object
      const customer = await stripe.customers.retrieve(session.customer as string)
      email = (customer as any).email
    }

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'No customer email found in Stripe session' 
      })
    }

    console.log('[ConfirmUpgrade] Customer email:', email)

    // Get the plan from session metadata
    const plan = (session.metadata as any)?.plan || 'starter'
    
    console.log('[ConfirmUpgrade] Upgrading user to:', plan)

    const supabase = createAdminClient()

    // Find the user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (findError || !users) {
      console.log('[ConfirmUpgrade] User not found:', { email, error: findError })
      return res.status(404).json({ 
        success: false, 
        error: `User not found for email: ${email}` 
      })
    }

    const userId = users.id

    // Update user tier (and clear trial if upgrading)
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        tier: plan,
        trial_converted: true,
        trial_expires_at: null,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    console.log('[ConfirmUpgrade] User tier updated')

    // Provision container asynchronously (don't wait for it)
    setImmediate(async () => {
      try {
        console.log('[ConfirmUpgrade] Starting async container provisioning...')
        await provisionContainer(userId)
        console.log('[ConfirmUpgrade] Container provisioning completed')
      } catch (error) {
        console.error('[ConfirmUpgrade] Error provisioning container:', error)
      }
    })

    // Generate a magic link so the user is auto-logged back in
    // (Stripe redirect clears the Supabase session)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
    let redirectUrl = `/auth/payment-login?email=${encodeURIComponent(email)}`

    try {
      console.log('[ConfirmUpgrade] Generating magic link for:', email)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${appUrl}/dashboard?upgraded=true`,
        },
      })

      if (linkError) {
        console.error('[ConfirmUpgrade] Magic link error:', linkError)
      } else if (linkData?.properties?.action_link) {
        console.log('[ConfirmUpgrade] Magic link generated successfully')
        redirectUrl = linkData.properties.action_link
      }
    } catch (err) {
      console.error('[ConfirmUpgrade] Magic link generation failed:', err)
      // Fall back to payment-login page
    }

    return res.status(200).json({ 
      success: true, 
      message: `Payment successful! Tier upgraded to ${plan}`,
      redirectUrl,
      email: email
    })
  } catch (error: any) {
    console.error('[ConfirmUpgrade] Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    })
  }
}
