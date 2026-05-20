#!/bin/bash
# Telegram Integration Deployment Script
# Run on the VPS as: bash deploy_telegram.sh

set -e

echo "🚀 LaVerdi Telegram Integration Deployment"
echo "=========================================="
echo ""

PORTAL_PATH="/root/laverdi-portal"
WEBHOOK_FILE="pages/api/webhooks/telegram.ts"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Backup existing files
# ─────────────────────────────────────────────────────────────────────────────

echo "📦 Step 1: Creating backups..."

if [ -f "$PORTAL_PATH/$WEBHOOK_FILE" ]; then
    cp "$PORTAL_PATH/$WEBHOOK_FILE" "$PORTAL_PATH/$WEBHOOK_FILE.backup.$(date +%s)"
    echo "   ✅ Backed up existing webhook handler"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Deploy webhook handler
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "📝 Step 2: Deploying webhook handler..."

# Create webhooks directory if it doesn't exist
mkdir -p "$PORTAL_PATH/pages/api/webhooks"

# Copy webhook handler
cat > "$PORTAL_PATH/$WEBHOOK_FILE" << 'WEBHOOK_EOF'
/**
 * Telegram Webhook Handler
 * 
 * Receives messages from Telegram and routes them to the user's OpenClaw agent.
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      })
    })

    if (!response.ok) {
      console.error(`[Telegram] Agent RPC error: ${response.status}`)
      return null
    }

    const data = await response.json()
    
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const update: TelegramUpdate = req.body
  const userId = req.query.user_id as string

  if (!update || !update.update_id) {
    console.warn('[Telegram] Invalid update received')
    return res.status(200).json({ ok: true })
  }

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
    `[Telegram] Message from @${username} (${telegramUserId}): ${text.substring(0, 50)}`
  )

  if (!userId) {
    console.error('[Telegram] Missing user_id in webhook query')
    return res.status(400).json({ error: 'Missing user_id' })
  }

  if (!text) {
    console.debug('[Telegram] Ignoring message without text')
    return res.status(200).json({ ok: true })
  }

  try {
    const { data: channelData, error: channelError } = await supabase
      .from('channels')
      .select('token')
      .eq('user_id', userId)
      .eq('platform', 'telegram')
      .eq('verified', true)
      .single()

    if (channelError || !channelData) {
      console.error('[Telegram] Channel not found:', channelError)
      return res.status(200).json({ ok: true })
    }

    const botToken = channelData.token
    const agent = await getUserAgent(userId)

    if (!agent) {
      console.error('[Telegram] No agent found for user:', userId)
      await sendTelegramMessage(botToken, chatId, '❌ Agent not running')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Telegram] Routing to agent on port ${agent.gateway_port}`)

    const agentResponse = await sendToAgent(agent.gateway_port, {
      type: 'message',
      channel: 'telegram',
      user_id: telegramUserId,
      username,
      text,
      chat_id: chatId
    })

    if (agentResponse) {
      console.log(`[Telegram] Agent responded`)
      await sendTelegramMessage(botToken, chatId, agentResponse)
    } else {
      await sendTelegramMessage(botToken, chatId, '❌ No response from agent')
    }

    return res.status(200).json({ ok: true })

  } catch (error) {
    console.error('[Telegram] Unhandled error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
WEBHOOK_EOF

echo "   ✅ Webhook handler deployed"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Rebuild portal
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "🔨 Step 3: Rebuilding portal..."

cd "$PORTAL_PATH"
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Restart portal
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "🔄 Step 4: Restarting portal..."

pm2 restart web

sleep 2

pm2 status web

echo "   ✅ Portal restarted"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5: Verify deployment
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "✅ Step 5: Verifying deployment..."

# Check webhook handler was deployed
curl -s https://laverdi.tech/api/webhooks/telegram -X GET 2>&1 | head -3

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://laverdi.tech/dashboard/channels"
echo "2. Create a test Telegram bot via @BotFather"
echo "3. Paste bot token into Telegram card"
echo "4. Send a message to your bot"
echo "5. Check logs: pm2 logs web --lines 50 | grep -i telegram"
echo ""
