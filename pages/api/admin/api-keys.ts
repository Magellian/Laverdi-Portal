import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { checkRateLimit, getRemainingCalls } from '@/lib/rate-limit'

// Generate a secure API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'lav_'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Fetch user tier for rate-limit check
    const supabaseAdmin = createAdminClient()
    
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single()

    const tier = userRow?.tier ?? 'free'

    // Enforce monthly call limit
    const allowed = await checkRateLimit(user.id, tier)
    if (!allowed) {
      res.setHeader('X-RateLimit-Remaining', '0')
      return res.status(429).json({
        error: 'Monthly call limit exceeded. Upgrade your plan for more API calls.',
      })
    }

    // Attach remaining-calls header for well-behaved clients
    const remaining = await getRemainingCalls(user.id)
    res.setHeader('X-RateLimit-Remaining', String(remaining))

    const { user_id, name } = req.body

    // Verify the user owns the requested resource
    if (user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid API key name' })
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'API key name is too long (max 100 characters)' })
    }

    // Generate the API key
    const apiKey = generateApiKey()

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id,
        name: name.trim(),
        key: apiKey,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to create API key' })
    }

    // Return the new key (only time it will be shown)
    return res.status(201).json({
      id: data.id,
      key: apiKey,
      message: 'API key created successfully. Save it somewhere safe.',
    })
  } catch (error: any) {
    console.error('Error creating API key:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
