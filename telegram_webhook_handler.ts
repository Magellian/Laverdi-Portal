/**
 * Telegram Webhook Handler
 * 
 * Receives messages from Telegram and routes them to the user's OpenClaw agent.
 * Telegram sends POST requests to this endpoint when:
 * - User sends a message to the bot
 * - User reacts to a message
 * - Other webhook events
 * 
 * Deploy to: /root/laverdi-portal/pages/api/webhooks/telegram.ts
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Telegram webhook update types
 */
interface TelegramMessage {
  message_id: number
  date: number
  chat: {
    id: number
    type: string
    title?: string
    first_name?: string
    last_name?: string
    username?: string
  }
  from: {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
  }
  text?: string
  caption?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  callback_query?: {
    id: string
    from: any
    chat_instance: string
    data?: string
    message?: TelegramMessage
  }
}

/**
 * Send a message to Telegram
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  parseMode: string = 'HTML'
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    })

    if (!response.ok) {
      console.error('[Telegram] Failed to send message:', response.status)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Error sending message:', error)
    return false
  }
}

/**
 * Get the user's agent instance
 */
async function getUserAgent(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_instances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('[Telegram] Error fetching user agent:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Telegram] Exception fetching user agent:', error)
    return null
  }
}

/**
 * Send message to OpenClaw agent via RPC
 */
async function sendToAgent(
  agentPort: number,
  message: {
    type: string
    channel: string
    user_id: number
    username?: string
    text: string
    chat_id: number
  }
): Promise<string | null> {
  try {
    const response = await fetch(`http://127.0.0.1:${agentPort}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'send_message',
        params: message,
        id: 1
      }),
      timeout: 30000 // 30 second timeout
    })

    if (!response.ok) {
      console.error(`[Telegram] Agent RPC error: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    // Extract result from RPC response
    if (data.result) {
      return data.result
    }
    
    if (data.error) {
      console.error('[Telegram] Agent error:', data.error)
      return null
    }

    return null
  } catch (error) {
    console.error('[Telegram] Error calling agent:', error)
    return null
  }
}

/**
 * Main webhook handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const update: TelegramUpdate = req.body
  const userId = req.query.user_id as string

  // Validate update
  if (!update || !update.update_id) {
    console.warn('[Telegram] Invalid update received')
    return res.status(200).json({ ok: true })
  }

  // Ignore non-message updates for now
  if (!update.message && !update.edited_message) {
    console.debug('[Telegram] Ignoring non-message update')
    return res.status(200).json({ ok: true })
  }

  const msg = update.message || update.edited_message!
  const chatId = msg.chat.id
  const telegramUserId = msg.from.id
  const username = msg.from.username || msg.from.first_name
  const text = msg.text || msg.caption || ''

  console.log(
    `[Telegram] Message from @${username} (${telegramUserId}): ${text.substring(0, 50)}...`
  )

  // Validate that we have a user_id and text
  if (!userId) {
    console.error('[Telegram] Missing user_id in webhook query')
    return res.status(400).json({ error: 'Missing user_id' })
  }

  if (!text) {
    console.debug('[Telegram] Ignoring message without text')
    return res.status(200).json({ ok: true })
  }

  try {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 1: Fetch user's Telegram channel config (to get bot token)
    // ────────────────────────────────────────────────────────────────────────

    const { data: channelData, error: channelError } = await supabase
      .from('channels')
      .select('token')
      .eq('user_id', userId)
      .eq('platform', 'telegram')
      .eq('verified', true)
      .single()

    if (channelError || !channelData) {
      console.error('[Telegram] Channel not found or not verified:', channelError)
      await sendTelegramMessage(
        'UNKNOWN', // We don't have the token, so this will fail
        chatId,
        '❌ Error: This bot is not properly configured. Please re-pair in LaVerdi.'
      )
      return res.status(200).json({ ok: true })
    }

    const botToken = channelData.token

    // ────────────────────────────────────────────────────────────────────────
    // STEP 2: Fetch user's agent instance
    // ────────────────────────────────────────────────────────────────────────

    const agent = await getUserAgent(userId)

    if (!agent) {
      console.error('[Telegram] No agent instance found for user:', userId)
      await sendTelegramMessage(
        botToken,
        chatId,
        '❌ Error: Your AI assistant is not running. Please start it in LaVerdi.'
      )
      return res.status(200).json({ ok: true })
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3: Send message to agent
    // ────────────────────────────────────────────────────────────────────────

    console.log(`[Telegram] Routing to agent on port ${agent.gateway_port}`)

    const agentResponse = await sendToAgent(agent.gateway_port, {
      type: 'message',
      channel: 'telegram',
      user_id: telegramUserId,
      username,
      text,
      chat_id: chatId
    })

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4: Send response back to Telegram
    // ────────────────────────────────────────────────────────────────────────

    if (agentResponse) {
      console.log(`[Telegram] Agent response: ${agentResponse.substring(0, 100)}...`)
      await sendTelegramMessage(botToken, chatId, agentResponse)
    } else {
      console.error('[Telegram] No response from agent')
      await sendTelegramMessage(
        botToken,
        chatId,
        '❌ No response from agent. Please check your connection.'
      )
    }

    return res.status(200).json({ ok: true })

  } catch (error) {
    console.error('[Telegram] Unhandled error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
