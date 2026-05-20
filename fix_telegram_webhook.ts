import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendTelegramMessage(botToken: string, chatId: number, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
    })
    return response.ok
  } catch (error) {
    console.error('[Telegram] Send error:', error)
    return false
  }
}

async function getUserIdFromBotToken(botToken: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('user_id')
      .eq('channel_name', 'telegram')
      .eq('config->>botToken', botToken)
      .limit(1)
      .single()
    
    if (error || !data) {
      console.error('[Telegram] Failed to find user:', error)
      return null
    }
    
    return data.user_id
  } catch (error) {
    console.error('[Telegram] Query error:', error)
    return null
  }
}

async function getUserAgent(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_instances')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single()
    return error ? null : data
  } catch (error) {
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
    console.error('[Telegram] Agent error:', error)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const update = req.body
  const botToken = req.query.token as string

  if (!update || !update.message || !update.message.text || !botToken) {
    return res.status(200).json({ ok: true })
  }

  const msg = update.message
  const text = msg.text
  const username = msg.from.username || msg.from.first_name
  const chatId = msg.chat.id
  const telegramUserId = msg.from.id

  console.log(`[Telegram] Message from @${username}: ${text.substring(0, 50)}`)

  try {
    // Look up user from bot token
    const userId = await getUserIdFromBotToken(botToken)
    if (!userId) {
      console.error('[Telegram] Could not find user for token')
      await sendTelegramMessage(botToken, chatId, 'Bot not configured')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Telegram] Found user: ${userId}`)

    // Get user's agent
    const agent = await getUserAgent(userId)
    
    if (!agent) {
      console.error('[Telegram] No agent found for user')
      await sendTelegramMessage(botToken, chatId, 'Agent not available')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Telegram] Routing to port ${agent.gateway_port}`)

    const response = await sendToAgent(agent.gateway_port, {
      type: 'message',
      channel: 'telegram',
      user_id: telegramUserId,
      username: username,
      text: text,
      chat_id: chatId
    })

    if (response) {
      console.log('[Telegram] Agent responded, sending back')
      await sendTelegramMessage(botToken, chatId, response)
    } else {
      console.log('[Telegram] No response from agent')
      await sendTelegramMessage(botToken, chatId, 'No response from agent')
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('[Telegram] Unhandled error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
