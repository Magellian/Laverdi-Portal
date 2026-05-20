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

async function getUserAgentByEmail(email: string) {
  try {
    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single()
    
    if (userError || !userData) {
      console.error('[Telegram] User not found:', userError)
      return null
    }

    // Get user's agent
    const { data: agentData, error: agentError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userData.id)
      .limit(1)
      .single()
    
    if (agentError || !agentData) {
      console.error('[Telegram] Agent not found:', agentError)
      return null
    }

    return agentData
  } catch (error) {
    console.error('[Telegram] Lookup error:', error)
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
    // For now, hardcode to the pairing user (chrislaverdiere@gmail.com)
    // In production, would look up from stored channel config
    const agent = await getUserAgentByEmail('chrislaverdiere@gmail.com')
    
    if (!agent) {
      console.error('[Telegram] No agent found')
      await sendTelegramMessage(botToken, chatId, 'Agent not available')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Telegram] Routing to port ${agent.port}`)

    const response = await sendToAgent(agent.port, {
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
