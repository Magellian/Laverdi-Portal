import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, user_id } = req.body

    if (!email || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const supabaseAdmin = createAdminClient()

    // Check if user profile already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (!existing) {
      // Create user profile
      const { error } = await supabaseAdmin.from('users').insert({
        id: user_id,
        email,
        tier: 'starter',
        api_key: `lav_${Math.random().toString(36).substring(2, 34)}`,
      })

      if (error) {
        console.error('Error creating user profile:', error)
        return res.status(500).json({ error: 'Failed to create user profile' })
      }
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Auth callback error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
