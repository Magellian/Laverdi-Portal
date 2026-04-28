import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { signOut } from '@/lib/auth'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChannelConfig {
  enabled: boolean
  connected: boolean
  hint?: string // last 4 chars of the stored value
}

interface ChannelsData {
  telegram?: ChannelConfig
  discord?: ChannelConfig
  whatsapp?: ChannelConfig
  slack?: ChannelConfig
  signal?: ChannelConfig
}

interface CardState {
  inputValue: string
  loading: boolean
  success: string | null
  error: string | null
  expanded: boolean
}

// ─── Channel definitions ──────────────────────────────────────────────────────

const CHANNELS = [
  {
    key: 'telegram',
    emoji: '🤖',
    label: 'Telegram Bot',
    description: 'Chat with your AI via Telegram on any device',
    instructions: [
      'Open Telegram and message @BotFather',
      'Send /newbot and follow the prompts',
      'Copy the bot token (looks like: 123456789:AABcd...)',
      'Paste it below and save',
    ],
    placeholder: '123456789:AABbCc...',
  },
  {
    key: 'discord',
    emoji: '🎮',
    label: 'Discord Bot',
    description: 'Use your AI in Discord servers and DMs',
    instructions: [
      'Go to discord.com/developers/applications',
      'Create a New Application',
      'Go to Bot → Reset Token → Copy token',
      'Enable Message Content Intent under Privileged Intents',
      'Paste the token below',
    ],
    placeholder: 'MTIzND...',
  },
  {
    key: 'whatsapp',
    emoji: '💬',
    label: 'WhatsApp',
    description: 'Message your AI from WhatsApp',
    instructions: [
      'WhatsApp requires a phone number pairing.',
      'Save your token below',
      'Your AI will show a QR code or pairing code in the web interface',
      'Scan it from WhatsApp on your phone',
    ],
    placeholder: 'Phone number or API key',
  },
  {
    key: 'slack',
    emoji: '💼',
    label: 'Slack',
    description: 'Chat with your AI in Slack workspaces',
    instructions: [
      'Go to api.slack.com/apps',
      'Create a New App from scratch',
      'Add OAuth scopes: app_mentions:read, chat:write, im:history, im:read, im:write',
      'Install to workspace',
      'Copy Bot User OAuth Token (starts with xoxb-)',
    ],
    placeholder: 'xoxb-...',
  },
  {
    key: 'signal',
    emoji: '📱',
    label: 'Signal',
    description: 'Private, encrypted AI conversations via Signal',
    instructions: [
      'Enter your Signal phone number. Your AI will use this number to send and receive Signal messages.',
    ],
    placeholder: '+15551234567',
  },
] as const

type ChannelKey = (typeof CHANNELS)[number]['key']

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChannelsDashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [channelsData, setChannelsData] = useState<ChannelsData>({})
  const [pageLoading, setPageLoading] = useState(true)

  // Per-card state
  const [cards, setCards] = useState<Record<ChannelKey, CardState>>(
    () =>
      Object.fromEntries(
        CHANNELS.map((c) => [
          c.key,
          { inputValue: '', loading: false, success: null, error: null, expanded: false },
        ])
      ) as Record<ChannelKey, CardState>
  )

  // ── Bootstrap auth + load channels ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      setUserEmail(session.user.email ?? '')
      setAuthToken(session.access_token)

      try {
        const res = await fetch('/api/channels', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data: ChannelsData = await res.json()
          setChannelsData(data)
        }
      } catch (err) {
        console.error('[Channels] Failed to load channel config:', err)
      } finally {
        setPageLoading(false)
      }
    }

    init()
  }, [router])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function updateCard(key: ChannelKey, patch: Partial<CardState>) {
    setCards((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function toggleExpanded(key: ChannelKey) {
    updateCard(key, { expanded: !cards[key].expanded })
  }

  async function handleSave(key: ChannelKey) {
    if (!authToken) return
    const value = cards[key].inputValue.trim()
    if (!value) {
      updateCard(key, { error: 'Please enter a value before saving.', success: null })
      return
    }

    updateCard(key, { loading: true, error: null, success: null })

    // Build config payload based on channel
    const configMap: Record<ChannelKey, Record<string, unknown>> = {
      telegram: { botToken: value },
      discord: { botToken: value },
      whatsapp: { phoneNumberId: value },
      slack: { botToken: value },
      signal: { phoneNumber: value },
    }

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ channel: key, config: configMap[key] }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      // Optimistically mark as connected
      setChannelsData((prev) => ({
        ...prev,
        [key]: {
          enabled: true,
          connected: true,
          hint: value.slice(-4),
        },
      }))
      updateCard(key, {
        loading: false,
        success: 'Connected successfully!',
        inputValue: '',
      })
    } catch (err: unknown) {
      updateCard(key, {
        loading: false,
        error: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Channels – Laverdi.tech</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Laverdi.tech
            </Link>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-gray-700 text-sm hidden sm:inline">{userEmail}</span>
              )}
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Channels</h1>
          <p className="text-gray-500 mb-8">
            Connect your messaging apps to your AI assistant. Configure a channel below to start chatting.
          </p>

          {/* ── Channel grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHANNELS.map((channel) => {
              const cfg = channelsData[channel.key as ChannelKey]
              const card = cards[channel.key as ChannelKey]
              const isConnected = cfg?.connected ?? false

              return (
                <div
                  key={channel.key}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{channel.emoji}</span>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {channel.label}
                        </h2>
                        <p className="text-gray-500 text-sm">{channel.description}</p>
                      </div>
                    </div>

                    {/* Badge */}
                    {isConnected ? (
                      <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Connected
                      </span>
                    ) : (
                      <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        Not connected
                      </span>
                    )}
                  </div>

                  {/* Connected hint */}
                  {isConnected && cfg?.hint && (
                    <p className="text-xs text-gray-400 font-mono">
                      Token ending in …{cfg.hint}
                    </p>
                  )}

                  {/* Expandable instructions */}
                  <div>
                    <button
                      onClick={() => toggleExpanded(channel.key as ChannelKey)}
                      className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      {card.expanded ? '▲ Hide setup instructions' : '▼ Show setup instructions'}
                    </button>

                    {card.expanded && (
                      <ol className="mt-3 space-y-1.5 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                        {channel.instructions.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            {channel.instructions.length > 1 && (
                              <span className="font-semibold text-blue-600 shrink-0">
                                {i + 1}.
                              </span>
                            )}
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Input + Save */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={card.inputValue}
                      onChange={(e) =>
                        updateCard(channel.key as ChannelKey, {
                          inputValue: e.target.value,
                          success: null,
                          error: null,
                        })
                      }
                      placeholder={
                        isConnected
                          ? `Update (current: …${cfg?.hint ?? '????'})`
                          : channel.placeholder
                      }
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => handleSave(channel.key as ChannelKey)}
                      disabled={card.loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {card.loading ? 'Saving…' : 'Save'}
                    </button>
                  </div>

                  {/* Inline feedback */}
                  {card.success && (
                    <p className="text-sm text-green-600 font-medium">{card.success}</p>
                  )}
                  {card.error && (
                    <p className="text-sm text-red-600 font-medium">{card.error}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
