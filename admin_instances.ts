// pages/api/admin/instances.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_TOKEN = process.env.ADMIN_UPGRADE_TOKEN || 'laverdi-admin-api-2026'

interface InstanceWithUser {
  id: string
  container_id: string
  user_id: string
  user_email: string
  ip_address: string | null
  status: string
  port: number
  created_at: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authorization
  const authHeader = req.headers.authorization
  const token = authHeader?.split('Bearer ')[1]

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get all instances with their user info
    const { data: instances, error } = await supabase
      .from('instances')
      .select(`
        id,
        container_id,
        user_id,
        ip_address,
        status,
        port,
        created_at,
        users!inner (id, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    // Format response
    const formatted = (instances || []).map((inst: any) => ({
      id: inst.id,
      container_id: inst.container_id,
      user_id: inst.user_id,
      user_email: inst.users?.email || 'UNKNOWN',
      ip_address: inst.ip_address || 'PENDING',
      status: inst.status,
      port: inst.port,
      created_at: inst.created_at
    }))

    return res.status(200).json({
      success: true,
      total: formatted.length,
      instances: formatted
    })

  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
