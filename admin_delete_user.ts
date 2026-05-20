// pages/api/admin/delete-user.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_TOKEN = process.env.ADMIN_UPGRADE_TOKEN || 'laverdi-admin-api-2026'
const VULTR_API_KEY = process.env.VULTR_API_KEY || ''

interface AuditLog {
  action: string
  admin_email: string
  target_user_id: string
  target_user_email: string
  details: any
  timestamp: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authorization
  const authHeader = req.headers.authorization
  const token = authHeader?.split('Bearer ')[1]

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    console.log(`[DELETE] Starting deletion for user: ${userId}`)

    // Step 1: Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found', details: userError?.message })
    }

    console.log(`[DELETE] Found user: ${user.email}`)

    // Step 2: Get all instances for this user
    const { data: instances, error: instancesError } = await supabase
      .from('instances')
      .select('id, container_id, ip_address, status')
      .eq('user_id', userId)

    if (instancesError) {
      console.error(`[DELETE] Error fetching instances:`, instancesError)
      return res.status(500).json({ error: 'Failed to fetch instances', details: instancesError.message })
    }

    console.log(`[DELETE] Found ${instances?.length || 0} instances`)

    // Step 3: Terminate Vultr instances
    const vultrResults = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as any[]
    }

    if (instances && instances.length > 0 && VULTR_API_KEY) {
      for (const instance of instances) {
        vultrResults.attempted++
        try {
          console.log(`[DELETE] Terminating Vultr instance: ${instance.container_id}`)
          
          const vultrResponse = await fetch(`https://api.vultr.com/v2/instances/${instance.container_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${VULTR_API_KEY}`,
              'Content-Type': 'application/json'
            }
          })

          if (vultrResponse.ok || vultrResponse.status === 204) {
            vultrResults.succeeded++
            console.log(`[DELETE] Successfully terminated: ${instance.container_id}`)
          } else {
            vultrResults.failed++
            const errorText = await vultrResponse.text()
            vultrResults.errors.push({
              instance_id: instance.container_id,
              status: vultrResponse.status,
              error: errorText
            })
            console.error(`[DELETE] Failed to terminate ${instance.container_id}: ${vultrResponse.status}`)
          }
        } catch (vultrError: any) {
          vultrResults.failed++
          vultrResults.errors.push({
            instance_id: instance.container_id,
            error: vultrError.message
          })
          console.error(`[DELETE] Vultr API error for ${instance.container_id}:`, vultrError)
        }
      }
    } else if (!VULTR_API_KEY) {
      console.warn('[DELETE] VULTR_API_KEY not set, skipping instance termination')
    }

    // Step 4: Delete from Supabase (cascade)
    console.log(`[DELETE] Deleting from Supabase...`)

    // Delete instances
    const { error: delInstError } = await supabase
      .from('instances')
      .delete()
      .eq('user_id', userId)

    if (delInstError) {
      console.error('[DELETE] Error deleting instances:', delInstError)
      return res.status(500).json({ 
        error: 'Failed to delete instances from database',
        details: delInstError.message,
        vultr_results: vultrResults
      })
    }

    // Delete subscriptions
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
      .catch(e => console.error('[DELETE] Error deleting subscriptions:', e))

    // Delete usage logs
    await supabase
      .from('usage_logs')
      .delete()
      .eq('user_id', userId)
      .catch(e => console.error('[DELETE] Error deleting usage logs:', e))

    // Delete API keys
    await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', userId)
      .catch(e => console.error('[DELETE] Error deleting API keys:', e))

    // Step 5: Delete from Auth
    console.log(`[DELETE] Deleting from Auth...`)
    
    const adminAuthClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      await adminAuthClient.auth.admin.deleteUser(userId)
    } catch (authError: any) {
      console.error('[DELETE] Error deleting from auth:', authError)
      // Don't fail if auth deletion fails, DB is already cleaned
    }

    // Step 6: Create audit log
    const auditLog: AuditLog = {
      action: 'user_deleted',
      admin_email: 'admin@laverdi.tech',
      target_user_id: userId,
      target_user_email: user.email,
      details: {
        instances_deleted: instances?.length || 0,
        vultr_results: vultrResults
      },
      timestamp: new Date().toISOString()
    }

    await supabase
      .from('audit_logs')
      .insert([auditLog])
      .catch(e => console.error('[DELETE] Error creating audit log:', e))

    console.log(`[DELETE] Successfully deleted user: ${user.email}`)

    return res.status(200).json({
      success: true,
      message: `User ${user.email} and their instances have been deleted`,
      user: {
        id: user.id,
        email: user.email
      },
      vultr_results: vultrResults,
      instances_deleted: instances?.length || 0
    })

  } catch (error: any) {
    console.error('[DELETE] Fatal error:', error)
    return res.status(500).json({
      error: 'Deletion failed',
      details: error.message
    })
  }
}
