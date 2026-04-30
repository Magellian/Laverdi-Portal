/**
 * Admin endpoint to create login_tokens table
 * Run once to set up the table
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check - use a secret token
  const secret = req.headers['x-setup-secret']
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = createAdminClient()

    // Create the table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS login_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_login_tokens_token ON login_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_login_tokens_user_id ON login_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_login_tokens_expires_at ON login_tokens(expires_at);
      `
    })

    if (error) throw error

    return res.status(200).json({ success: true, message: 'login_tokens table created' })
  } catch (error: any) {
    console.error('Setup error:', error)
    return res.status(500).json({ error: error.message })
  }
}
