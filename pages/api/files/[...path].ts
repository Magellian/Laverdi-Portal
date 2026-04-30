/**
 * File Browser API — Proxies file requests to user's OpenClaw container
 * 
 * GET /api/files?action=list&path=/          → List directory
 * GET /api/files?action=download&path=/file  → Download file
 * GET /api/files?action=preview&path=/file   → Preview file content (text only)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth: get user from bearer token (header or query param for downloads)
  const authHeader = req.headers.authorization
  const queryToken = req.query.token as string
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const supabase = createAdminClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Get user's instance
  const { data: instance, error: instanceError } = await supabase
    .from('instances')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .single()

  if (instanceError || !instance) {
    return res.status(404).json({ error: 'No active instance found' })
  }

  // Connect to container via Docker network using container name
  // File server runs on port 8701 inside the container
  const containerName = instance.container_id
  const fileServerUrl = `http://${containerName}:8701`
  const action = req.query.action as string || 'list'
  const filePath = req.query.path as string || '/'

  try {
    const fileApiUrl = `${fileServerUrl}/?action=${action}&path=${encodeURIComponent(filePath)}`
    console.log('[Files API] Fetching:', fileApiUrl)
    
    const response = await fetch(fileApiUrl, {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Container returned ${response.status}` })
    }

    if (action === 'download') {
      // Stream the file back
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const filename = filePath.split('/').pop() || 'download'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      const buffer = await response.arrayBuffer()
      return res.send(Buffer.from(buffer))
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error: any) {
    console.error('[Files API] Error:', error.message)
    return res.status(502).json({ error: 'Failed to connect to container' })
  }
}
