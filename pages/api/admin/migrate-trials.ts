/**
 * Admin endpoint: Apply trial system migration
 * GET /api/admin/migrate-trials?token=ADMIN_TOKEN
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

const ADMIN_TOKEN = process.env.ADMIN_MIGRATION_TOKEN || 'change-me'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.query.token as string
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createAdminClient()

    // 1. Add trial columns if they don't exist
    const { error: alterError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS trial_converted BOOLEAN DEFAULT FALSE;
        
        CREATE INDEX IF NOT EXISTS idx_trial_expires_at 
        ON users(trial_expires_at) 
        WHERE trial_expires_at IS NOT NULL;
      `
    })

    if (alterError) {
      console.error('Migration error:', alterError)
      // Ignore "column already exists" errors
      if (!alterError.message.includes('already exists')) {
        throw alterError
      }
    }

    // 2. Backfill existing free users with trial
    const { error: backfillError } = await supabase
      .from('users')
      .update({
        tier: 'starter',
        trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('tier', 'free')
      .is('trial_expires_at', null)

    if (backfillError) {
      console.error('Backfill error:', backfillError)
      throw backfillError
    }

    return res.status(200).json({
      message: 'Trial system migration completed',
      steps: [
        '✓ Added trial_expires_at column',
        '✓ Added trial_converted column',
        '✓ Created index on trial_expires_at',
        '✓ Backfilled free users with 14-day trials',
      ]
    })
  } catch (error) {
    console.error('Migration failed:', error)
    return res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
