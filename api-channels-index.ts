import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'

const VPS_API_URL = process.env.VPS_API_URL ?? ''
const VPS_ADMIN_TOKEN = process.env.VPS_ADMIN_TOKEN ?? ''

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function verifyToken(req: NextApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null

  return data.user.id
}

// ─── Channel config builder ───────────────────────────────────────────────────

type ChannelName = 'telegram' | 'discord' | 'whatsapp' | 'slack' | 'signal'

interface ChannelConfigInput {
  botToken?: string
  phoneNumberId?: string
  phoneNumber?: string
}

function buildChannelConfig(
  channel: ChannelName,
  config: ChannelConfigInput
): Record<string, unknown> {
  switch (channel) {
    case 'telegram':
      return { enabled: true, botToken: config.botToken, dmPolicy: 'pairing' }
    case 'discord':
      return { enabled: true, botToken: config.botToken, dmPolicy: 'pairing' }
    case 'whatsapp':
      return { enabled: true, phoneNumberId: config.phoneNumberId }
    case 'slack':
      return { enabled: true, botToken: config.botToken }
    case 'signal':
      return { enabled: true, phoneNumber: config.phoneNumber }
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
}

// ─── GET /api/channels ────────────────────────────────────────────────────────

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const userId = await verifyToken(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const url = `${VPS_API_URL}/api/get-channels?userId=${encodeURIComponent(userId)}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VPS_ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[GET /api/channels] VPS error:', response.status, errText)
      return res.status(response.status).json({ error: 'Failed to fetch channel config' })
    }

    const data = await response.json()

    // Transform to a simple { [channel]: { enabled, connected, hint } } shape
    // expected by the frontend.  The raw VPS response may vary; normalise here.
    const channels: Record<string, { enabled: boolean; connected: boolean; hint?: string }> = {}

    for (const [key, val] of Object.entries(data?.channels ?? data ?? {})) {
      const cfg = val as Record<string, unknown>
      // Determine the "main" value to extract hint from
      const primaryValue =
        (cfg.botToken as string | undefined) ??
        (cfg.phoneNumberId as string | undefined) ??
        (cfg.phoneNumber as string | undefined) ??
        ''

      channels[key] = {
        enabled: Boolean(cfg.enabled),
        connected: Boolean(cfg.enabled) && Boolean(primaryValue),
        hint: primaryValue ? primaryValue.slice(-4) : undefined,
      }
    }

    return res.status(200).json(channels)
  } catch (err) {
    console.error('[GET /api/channels] Unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ─── POST /api/channels ───────────────────────────────────────────────────────

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const userId = await verifyToken(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { channel, config } = req.body as {
    channel?: ChannelName
    config?: ChannelConfigInput
  }

  const validChannels: ChannelName[] = ['telegram', 'discord', 'whatsapp', 'slack', 'signal']
  if (!channel || !validChannels.includes(channel)) {
    return res.status(400).json({ error: 'Invalid or missing channel name' })
  }

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'Missing config object' })
  }

  let channelConfig: Record<string, unknown>
  try {
    channelConfig = buildChannelConfig(channel, config)
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message })
  }

  try {
    const response = await fetch(`${VPS_API_URL}/api/configure-channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VPS_ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        channels: { [channel]: channelConfig },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[POST /api/channels] VPS error:', response.status, errText)
      return res.status(response.status).json({ error: 'Failed to configure channel' })
    }

    const data = await response.json().catch(() => ({ ok: true }))
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    console.error('[POST /api/channels] Unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}
