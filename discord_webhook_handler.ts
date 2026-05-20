import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendDiscordMessage(botToken: string, channelId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://discordapp.com/api/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: text })
    })
    return response.ok
  } catch (error) {
    console.error('[Discord] Send error:', error)
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
      console.error('[Discord] User not found:', userError)
      return null
    }

    const { data: agentData, error: agentError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userData.id)
      .limit(1)
      .single()
    
    if (agentError || !agentData) {
      console.error('[Discord] Agent not found:', agentError)
      return null
    }

    return agentData
  } catch (error) {
    console.error('[Discord] Lookup error:', error)
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
    console.error('[Discord] Agent error:', error)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const update = req.body
  const botToken = req.query.token as string

  if (!update || !update.d || !update.d.content || !botToken) {
    return res.status(200).json({ ok: true })
  }

  const msg = update.d
  const text = msg.content
  const username = msg.author?.username || 'unknown'
  const channelId = msg.channel_id
  const discordUserId = msg.author?.id

  console.log(`[Discord] Message from @${username}: ${text.substring(0, 50)}`)

  try {
    // Hardcode to the pairing user (chrislaverdiere@gmail.com)
    // In production, would look up from stored channel config
    const agent = await getUserAgentByEmail('chrislaverdiere@gmail.com')
    
    if (!agent) {
      console.error('[Discord] No agent found')
      await sendDiscordMessage(botToken, channelId, 'Agent not available')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Discord] Routing to port ${agent.port}`)

    const response = await sendToAgent(agent.port, {
      type: 'message',
      channel: 'discord',
      user_id: discordUserId,
      username: username,
      text: text,
      channel_id: channelId
    })

    if (response) {
      console.log('[Discord] Agent responded, sending back')
      await sendDiscordMessage(botToken, channelId, response)
    } else {
      console.log('[Discord] No response from agent')
      await sendDiscordMessage(botToken, channelId, 'No response from agent')
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('[Discord] Unhandled error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
