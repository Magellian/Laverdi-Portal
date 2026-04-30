import type { NextApiRequest, NextApiResponse } from 'next'
import { createBrowserClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: Add authentication check for admin users
  // For now, this is a public endpoint - secure this in production

  if (req.method === 'GET') {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          subscriptions (status, tier)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json(data)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
