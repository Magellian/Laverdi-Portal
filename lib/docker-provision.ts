import crypto from 'crypto'
import { createAdminClient } from './supabase'

/**
 * Provision a Docker container for a new user
 * Spins up an OpenClaw instance on the shared VPS
 */
export async function provisionContainer(userId: string) {
  const VPS_API_URL = process.env.VPS_API_URL || 'http://10.242.212.97:8000'
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const WEBHOOK_SECRET = process.env.DO_CALLBACK_SECRET || 'fallback-secret-change-me'

  if (!VPS_API_URL) {
    throw new Error('VPS API URL not configured')
  }

  // Generate a secure pairing token
  const pairingToken = crypto.randomBytes(32).toString('hex')
  const containerName = `openclaw-${userId.substring(0, 8)}-${Date.now()}`

  try {
    // Call the VPS provisioning API to spin up a container
    const response = await fetch(`${VPS_API_URL}/api/provision-container`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VPS_ADMIN_TOKEN || ''}`,
      },
      body: JSON.stringify({
        userId,
        containerName,
        pairingToken,
        callbackUrl: `${APP_URL}/api/webhooks/do-callback`,
        webhookSecret: WEBHOOK_SECRET,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Failed to provision container: ${response.status} ${JSON.stringify(errorData)}`
      )
    }

    const containerData = await response.json()

    // Store the pending container state in Supabase
    try {
      const supabaseAdmin = createAdminClient()
      
      // Try to insert with all fields first
      let error = null
      let result = null
      
      try {
        // Map tier to model
        const tierModelMap: Record<string, string> = {
          'free': 'anthropic-claude-haiku-4.5',
          'starter': 'anthropic-claude-4.6-sonnet',
          'professional': 'anthropic-claude-opus-4.6',
        }
        
        // Get user's tier to determine model
        let modelId = 'anthropic-claude-4.6-sonnet' // default
        try {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('tier')
            .eq('id', userId)
            .single()
          if (userData?.tier && tierModelMap[userData.tier]) {
            modelId = tierModelMap[userData.tier]
          }
        } catch (e) {
          console.error('[Docker Provision] Error fetching user tier:', e)
        }

        const insertData: any = {
          user_id: userId,
          container_id: containerData.containerName || containerData.containerId,
          model_id: modelId,
          status: 'provisioning',
          port: containerData.port || null,
          ip_address: (containerData.ipAddress || '64.23.142.154').replace(/^https?:\/\//, '').replace(/:\d+$/, '') || null,
          api_key: containerData.gatewayToken || pairingToken,
        }
        
        console.log('[Docker Provision] Inserting instance record:', insertData)
        result = await supabaseAdmin.from('instances').insert(insertData)
        error = result.error
      } catch (err: any) {
        error = err
      }

      if (error) {
        console.error('[Docker Provision] Failed to create instance record:', error)
        // Don't throw - container is still provisioned, just not tracked
      } else {
        console.log('[Docker Provision] Instance record created:', {
          userId,
          containerId: containerData.containerId,
          port: containerData.port,
          ip: containerData.ipAddress,
        })
      }
    } catch (err) {
      console.error('[Docker Provision] Error storing instance in Supabase:', err)
    }

    console.log(`[Docker Provision] Container provisioned for user ${userId}:`, {
      containerName,
      status: 'provisioning',
    })

    return {
      containerId: containerData.containerId || containerName,
      pairingToken,
      containerName,
    }
  } catch (error) {
    console.error('[Docker Provision] Error provisioning container:', error)
    throw error
  }
}

/**
 * Cleanup container when user is deleted or subscription cancelled
 */
export async function deleteContainer(userId: string) {
  const VPS_API_URL = process.env.VPS_API_URL || 'http://10.242.212.97:8000'

  if (!VPS_API_URL) {
    throw new Error('VPS API URL not configured')
  }

  try {
    const response = await fetch(`${VPS_API_URL}/api/delete-container`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VPS_ADMIN_TOKEN || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      console.error(`[Docker Cleanup] Failed to delete container for user ${userId}`)
    }
  } catch (error) {
    console.error('[Docker Cleanup] Error deleting container:', error)
  }
}
