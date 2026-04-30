/**
 * Admin Upgrade User Endpoint
 * For testing: manually upgrade a user's tier without going through Stripe
 * 
 * POST /api/admin/upgrade-user
 * Body: { email, tier }
 * Header: Authorization: Bearer ADMIN_TOKEN
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { provisionContainer } from '@/lib/docker-provision'

type ResponseData = {
  success: boolean
  message?: string
  error?: string
  user?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[AdminUpgrade] Request received:', { method: req.method, body: req.body })

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Verify admin token
  const adminToken = process.env.ADMIN_UPGRADE_TOKEN || 'admin-token-change-me-in-production'
  const authHeader = req.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[AdminUpgrade] No bearer token')
    return res.status(401).json({ success: false, error: 'Missing authorization header' })
  }

  const token = authHeader.substring(7)
  
  if (token !== adminToken) {
    console.log('[AdminUpgrade] Invalid token')
    return res.status(401).json({ success: false, error: 'Invalid admin token' })
  }

  try {
    const { email, tier } = req.body

    if (!email || !tier) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and tier are required' 
      })
    }

    if (!['free', 'starter', 'professional'].includes(tier)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tier. Must be: free, starter, or professional' 
      })
    }

    console.log('[AdminUpgrade] Upgrading user:', { email, tier })

    const supabase = createAdminClient()

    // Find user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, tier')
      .eq('email', email)
      .single()

    if (findError || !user) {
      console.log('[AdminUpgrade] User not found:', email)
      return res.status(404).json({ 
        success: false, 
        error: `User not found: ${email}` 
      })
    }

    const userId = user.id
    const oldTier = user.tier

    console.log('[AdminUpgrade] Found user:', { userId, oldTier, newTier: tier })

    // Update tier
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        tier,
        trial_converted: tier !== 'free',
        trial_expires_at: tier === 'free' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[AdminUpgrade] Update failed:', updateError)
      throw updateError
    }

    console.log('[AdminUpgrade] Tier updated successfully')

    // Provision container asynchronously
    setImmediate(async () => {
      try {
        console.log('[AdminUpgrade] Starting async container provisioning...')
        await provisionContainer(userId)
        console.log('[AdminUpgrade] Container provisioning completed')
      } catch (error) {
        console.error('[AdminUpgrade] Error provisioning container:', error)
      }
    })

    return res.status(200).json({
      success: true,
      message: `User upgraded from ${oldTier} to ${tier}`,
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('[AdminUpgrade] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}
