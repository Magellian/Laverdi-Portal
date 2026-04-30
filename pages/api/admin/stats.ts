import type { NextApiRequest, NextApiResponse } from 'next'
import { createBrowserClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: Add authentication check for admin users

  if (req.method === 'GET') {
    try {
      const supabase = createBrowserClient()
      
      // Total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // MRR calculation
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status')

      const activeCount = subscriptions?.filter(
        (s) => s.status === 'active'
      ).length || 0
      const estimatedMRR = activeCount * 150 // Rough estimate based on average

      // Usage stats
      const { data: logs } = await supabase
        .from('usage_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const totalRequests = logs?.length || 0

      return res.status(200).json({
        totalUsers: userCount || 0,
        activeSubscriptions: activeSubscriptions || 0,
        estimatedMRR,
        totalRequests,
        avgRequestsPerDay: Math.round(totalRequests / 30),
      })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
