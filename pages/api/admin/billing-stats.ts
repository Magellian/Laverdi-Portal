import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabaseAdmin = createAdminClient()

    // Get subscription info
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Calculate YTD total paid
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1).toISOString()

    // In production, fetch from Stripe API
    // For now, we'll provide mock invoice data
    const invoices = [
      {
        id: 'inv_001',
        number: 'INV-2026-001',
        date: new Date(2026, 0, 15).toISOString(),
        amount: 2999, // $29.99
        status: 'paid',
        paid_date: new Date(2026, 0, 15).toISOString(),
      },
      {
        id: 'inv_002',
        number: 'INV-2026-002',
        date: new Date(2026, 1, 15).toISOString(),
        amount: 2999,
        status: 'paid',
        paid_date: new Date(2026, 1, 15).toISOString(),
      },
      {
        id: 'inv_003',
        number: 'INV-2026-003',
        date: new Date(2026, 2, 15).toISOString(),
        amount: 2999,
        status: 'paid',
        paid_date: new Date(2026, 2, 15).toISOString(),
      },
      {
        id: 'inv_004',
        number: 'INV-2026-004',
        date: new Date(2026, 3, 15).toISOString(),
        amount: 2999,
        status: 'paid',
        paid_date: new Date(2026, 3, 15).toISOString(),
      },
    ]

    // Calculate totals
    const totalPaidYtd = invoices
      .filter((inv) => inv.status === 'paid' && new Date(inv.date) >= new Date(yearStart))
      .reduce((sum, inv) => sum + inv.amount, 0)

    const nextBillingDate = subscription
      ? new Date(subscription.current_period_end).toISOString()
      : null

    return res.status(200).json({
      total_paid_ytd: totalPaidYtd,
      next_billing_date: nextBillingDate,
      invoices: invoices.slice(0, 10), // Return last 10 invoices
    })
  } catch (error: any) {
    console.error('Error fetching billing stats:', error)
    return res.status(500).json({ error: 'Failed to fetch billing stats' })
  }
}
