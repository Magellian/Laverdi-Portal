/**
 * Trial expiration check for API requests
 * Use this in /api/call to prevent expired trials from making requests
 */

import { createClient } from '@supabase/supabase-js'

export async function checkTrialStatus(userId: string, apiKey: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Get user details
  const { data: user, error } = await supabase
    .from('users')
    .select('id, tier, trial_expires_at, trial_converted')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return {
      allowed: false,
      reason: 'User not found',
    }
  }

  // Check if user is in a trial
  if (user.trial_expires_at) {
    const expiresAt = new Date(user.trial_expires_at)
    const now = new Date()

    // Trial expired?
    if (expiresAt < now) {
      return {
        allowed: false,
        reason: 'Trial expired',
        expired_at: user.trial_expires_at,
      }
    }

    // Trial active
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      allowed: true,
      reason: 'trial_active',
      days_remaining: daysRemaining,
      trial_expires_at: user.trial_expires_at,
    }
  }

  // Not on trial (must be paid)
  return {
    allowed: true,
    reason: 'paid_account',
  }
}

export function formatTrialWarning(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return '⚠️ Your trial expires TODAY. Add a payment method to continue.'
  } else if (daysRemaining === 1) {
    return '⚠️ Your trial expires TOMORROW. Add a payment method to continue.'
  } else if (daysRemaining <= 3) {
    return `⚠️ Your trial expires in ${daysRemaining} days. Add a payment method to continue.`
  } else if (daysRemaining <= 7) {
    return `📅 Your trial expires in ${daysRemaining} days.`
  }
  return ''
}
