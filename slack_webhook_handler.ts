import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Slack request signature verification
function verifySlackSignature(req: NextApiRequest): boolean {
  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET || ''
  const timestamp = req.headers['x-slack-request-timestamp'] as string
  const signature = req.headers['x-slack-signature'] as string

  if (!timestamp || !signature) return false

  // Prevent replay attacks
  const time = Math.floor(Date.now() / 1000)
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    console.warn('[Slack] Request too old, possible replay attack')
    return false
  }

  const sig_basestring = `v0:${timestamp}:${JSON.stringify(req.body)}`
  const my_signature = 'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sig_basestring).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(my_signature))
}

async function sendSlackMessage(botToken: string, channelId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channelId,
        text: text
      })
    })
    const data = await response.json()
    return data.ok === true
  } catch (error) {
    console.error('[Slack] Send error:', error)
    return false
  }
}

async function getUserAgentByEmail(email: string) {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single()
    
    if (userError || !userData) {
      console.error('[Slack] User not found:', userError)
      return null
    }

    const { data: agentData, error: agentError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userData.id)
      .limit(1)
      .single()
    
    if (agentError || !agentData) {
      console.error('[Slack] Agent not found:', agentError)
      return null
    }

    return agentData
  } catch (error) {
    console.error('[Slack] Lookup error:', error)
    return null
  }
}

async function sendToAgent(agentPort: number, message: any): Promise<string | null> {
  try {
    const response = await fetch(`http://127.0.0.1:${agentPort}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'send_message', params: message, id: 1 })
    })
    if (response.ok) {
      const data = await response.json()
      return data.result || null
    }
    return null
  } catch (error) {
    console.error('[Slack] Agent error:', error)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Slack signature
  if (!verifySlackSignature(req)) {
    console.warn('[Slack] Invalid signature')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const event = req.body

  // Handle Slack URL verification challenge
  if (event.type === 'url_verification') {
    return res.status(200).json({ challenge: event.challenge })
  }

  // Only process message events
  if (event.type !== 'event_callback' || !event.event || event.event.type !== 'message') {
    return res.status(200).json({ ok: true })
  }

  const msg = event.event
  const text = msg.text
  const username = msg.username || 'unknown'
  const channelId = msg.channel
  const slackUserId = msg.user

  // Ignore bot messages
  if (msg.bot_id || msg.subtype === 'bot_message') {
    return res.status(200).json({ ok: true })
  }

  console.log(`[Slack] Message from @${username}: ${text.substring(0, 50)}`)

  try {
    // Hardcode to the pairing user (chrislaverdiere@gmail.com)
    // In production, would look up from stored channel config
    const agent = await getUserAgentByEmail('chrislaverdiere@gmail.com')
    
    if (!agent) {
      console.error('[Slack] No agent found')
      await sendSlackMessage(req.query.token as string, channelId, 'Agent not available')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Slack] Routing to port ${agent.port}`)

    const response = await sendToAgent(agent.port, {
      type: 'message',
      channel: 'slack',
      user_id: slackUserId,
      username: username,
      text: text,
      channel_id: channelId
    })

    if (response) {
      console.log('[Slack] Agent responded, sending back')
      await sendSlackMessage(req.query.token as string, channelId, response)
    } else {
      console.log('[Slack] No response from agent')
      await sendSlackMessage(req.query.token as string, channelId, 'No response from agent')
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('[Slack] Unhandled error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
