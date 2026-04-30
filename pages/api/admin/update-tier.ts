import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check - use a secret key
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { email, tier } = req.body

    if (!email || !tier) {
      return res.status(400).json({ error: 'Missing email or tier' })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .update({ tier })
      .eq('email', email)
      .select()

    if (error) {
      console.error('Update error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: error.message })
  }
}
