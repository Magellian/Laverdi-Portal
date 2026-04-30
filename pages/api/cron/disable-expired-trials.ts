/**
 * Cron job: Disable expired trials
 * Call this nightly: GET /api/cron/disable-expired-trials?token=YOUR_SECRET
 * 
 * What it does:
 * 1. Find all trials that expired but weren't converted
 * 2. Mark them as trial_converted=true (effectively disabling access)
 * 3. Log the count
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron token
  const token = req.query.token as string
  if (token !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createAdminClient()

    // Find expired, unconverted trials
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('users')
      .select('id, email, trial_expires_at')
      .eq('trial_converted', false)
      .lt('trial_expires_at', new Date().toISOString())

    if (fetchError) throw fetchError

    if (!expiredTrials || expiredTrials.length === 0) {
      return res.status(200).json({
        message: 'No expired trials found',
        disabled_count: 0,
      })
    }

    // Disable them by marking as converted
    const userIds = expiredTrials.map(t => t.id)
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ trial_converted: true })
      .in('id', userIds)

    if (updateError) throw updateError

    console.log(`[Cron] Disabled ${expiredTrials.length} expired trials`)
    
    return res.status(200).json({
      message: 'Expired trials disabled',
      disabled_count: expiredTrials.length,
      trials: expiredTrials.map(t => ({ email: t.email, expired_at: t.trial_expires_at })),
    })
  } catch (error) {
    console.error('[Cron] Error disabling expired trials:', error)
    return res.status(500).json({ 
      error: 'Failed to disable expired trials',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
