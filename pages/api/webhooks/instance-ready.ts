/**
 * Webhook: Instance Ready
 * Called by Command Center when a user's OpenClaw container is fully configured
 * Updates instance status from 'provisioning' to 'ready'
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { sendInstanceReadyEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, status } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    console.log(`[InstanceReady] Updating instance for user ${userId} to ${status || 'ready'}`)

    const supabase = createAdminClient()

    // Update instance status
    const { data: instance, error } = await supabase
      .from('instances')
      .update({ status: status || 'ready' })
      .eq('user_id', userId)
      .select('*, users!inner(email)')
      .single()

    if (error) {
      console.error('[InstanceReady] Error updating instance:', error)
      // Try without join
      await supabase
        .from('instances')
        .update({ status: status || 'ready' })
        .eq('user_id', userId)
      
      // Send email separately
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      
      if (user?.email) {
        const { data: inst } = await supabase
          .from('instances')
          .select('ip_address, port')
          .eq('user_id', userId)
          .single()
        
        if (inst) {
          sendInstanceReadyEmail(user.email, `${inst.ip_address}:${inst.port}`)
            .catch(e => console.error('[InstanceReady] Email error:', e))
        }
      }
    } else if (instance) {
      // Send instance ready email
      const email = (instance as any).users?.email
      if (email && instance.ip_address) {
        sendInstanceReadyEmail(email, `${instance.ip_address}:${instance.port}`)
          .catch(e => console.error('[InstanceReady] Email error:', e))
      }
    }

    console.log(`[InstanceReady] Instance updated to ready for user ${userId}`)
    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('[InstanceReady] Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
