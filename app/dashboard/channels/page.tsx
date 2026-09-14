'use client'

import { useEffect, useState } from 'react'

interface Agent {
  id: string
  name: string | null
  status: string
  port: number | null
  hasTelegram: boolean
  hasDiscord: boolean
  hasSlack: boolean
}

type ConnectResult = { ok: boolean; message: string } | null

export default function ChannelsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  const [botToken, setBotToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [result, setResult] = useState<ConnectResult>(null)
  const [showSteps, setShowSteps] = useState(false)

  const [discordToken, setDiscordToken] = useState('')
  const [connectingDiscord, setConnectingDiscord] = useState(false)
  const [discordResult, setDiscordResult] = useState<ConnectResult>(null)
  const [showDiscordSteps, setShowDiscordSteps] = useState(false)

  const [slackToken, setSlackToken] = useState('')
  const [connectingSlack, setConnectingSlack] = useState(false)
  const [slackResult, setSlackResult] = useState<ConnectResult>(null)
  const [showSlackSteps, setShowSlackSteps] = useState(false)

  const fetchAgents = () => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        const running = (data.instances || []).filter((a: Agent) => a.status === 'running')
        setAgents(running)
        if (running.length === 1) setSelectedAgent(running[0].id)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const connectChannel = async (
    platform: 'telegram' | 'discord' | 'slack',
    token: string,
    setToken: (v: string) => void,
    setConnecting: (v: boolean) => void,
    setResult: (v: ConnectResult) => void
  ) => {
    if (!selectedAgent || !token) return
    setConnecting(true)
    setResult(null)

    try {
      const res = await fetch(`/api/agents/${selectedAgent}/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token }),
      })
      const data = await res.json()

      if (res.ok) {
        setResult({ ok: true, message: data.message || `${platform} connected!` })
        setToken('')
        fetchAgents()
      } else {
        setResult({ ok: false, message: data.error || 'Connection failed' })
      }
    } catch {
      setResult({ ok: false, message: 'Failed to connect. Try again.' })
    } finally {
      setConnecting(false)
    }
  }

  const connectTelegram = () =>
    connectChannel('telegram', botToken, setBotToken, setConnecting, setResult)
  const connectDiscord = () =>
    connectChannel('discord', discordToken, setDiscordToken, setConnectingDiscord, setDiscordResult)
  const connectSlack = () =>
    connectChannel('slack', slackToken, setSlackToken, setConnectingSlack, setSlackResult)

  const selectedAgentData = agents.find((a) => a.id === selectedAgent)

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white">Channels</h1>
        <p className="text-zinc-400 mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Connect Channels</h1>
        <p className="mt-1 text-zinc-400">
          Connect your agent to messaging platforms so you can chat with it anywhere.
        </p>
      </div>

      {/* Agent selector (shared across all channels) */}
      {agents.length === 0 ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-center mb-6">
          <p className="text-sm text-zinc-400">
            You need a running agent first.{' '}
            <a href="/dashboard/agents" className="text-white hover:underline">
              Deploy one →
            </a>
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4 mb-6">
          <label className="block text-sm text-zinc-400 mb-1">Select Agent</label>
          <select
            value={selectedAgent}
            onChange={(e) => {
              setSelectedAgent(e.target.value)
              setResult(null)
              setDiscordResult(null)
              setSlackResult(null)
            }}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
          >
            <option value="">Choose an agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || `Agent ${a.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Telegram Setup */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">✈️</span>
          <div>
            <h2 className="text-lg font-semibold text-white">Telegram</h2>
            <p className="text-sm text-zinc-400">Chat with your agent via Telegram bot</p>
          </div>
        </div>

        {/* Step-by-step guide toggle */}
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="text-sm text-zinc-400 hover:text-white transition-colors mb-4 flex items-center gap-1"
        >
          {showSteps ? '▼' : '▶'} How to get a bot token (step-by-step)
        </button>

        {showSteps && (
          <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Setup Guide</h3>

            {/* Step 1 */}
            <div className="mb-5">
              <div className="flex items-start gap-3 mb-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Get Telegram</p>
                  <p className="text-xs text-zinc-500 mt-1">Download Telegram if you don't have it.</p>
                </div>
              </div>
              <div className="ml-9 flex gap-3">
                <a
                  href="https://apps.apple.com/app/telegram-messenger/id686449807"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  📱 iOS App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=org.telegram.messenger"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  🤖 Google Play
                </a>
                <a
                  href="https://desktop.telegram.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  💻 Desktop
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-5">
              <div className="flex items-start gap-3 mb-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Open BotFather</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    BotFather is Telegram's official bot for creating bots.
                  </p>
                </div>
              </div>
              <div className="ml-9">
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Open @BotFather →
                </a>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Create your bot</p>
                  <p className="text-xs text-zinc-500 mt-1">Send these messages to BotFather:</p>
                  <div className="mt-2 space-y-2">
                    <div className="rounded bg-zinc-800 border border-zinc-700 px-3 py-1.5">
                      <code className="text-xs text-green-400">/newbot</code>
                      <span className="text-xs text-zinc-500 ml-2">← send this first</span>
                    </div>
                    <div className="rounded bg-zinc-800 border border-zinc-700 px-3 py-1.5">
                      <code className="text-xs text-green-400">My AI Agent</code>
                      <span className="text-xs text-zinc-500 ml-2">← pick any name</span>
                    </div>
                    <div className="rounded bg-zinc-800 border border-zinc-700 px-3 py-1.5">
                      <code className="text-xs text-green-400">myagent_laverdi_bot</code>
                      <span className="text-xs text-zinc-500 ml-2">← must end in "bot"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Copy the token</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    BotFather will reply with a token that looks like:
                  </p>
                  <div className="mt-2 rounded bg-zinc-800 border border-zinc-700 px-3 py-1.5">
                    <code className="text-xs text-yellow-400">123456789:ABCdefGHIjklmnop-QRSTuvwxyz</code>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Copy the entire token and paste it below. ↓
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connect Form */}
        {agents.length === 0 ? (
          <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-center">
            <p className="text-sm text-zinc-400">
              You need a running agent first.{' '}
              <a href="/dashboard/agents" className="text-white hover:underline">
                Deploy one →
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected status banner */}
            {selectedAgentData?.hasTelegram && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-2">
                <span className="text-blue-400 text-sm font-medium">Telegram connected</span>
                <span className="text-zinc-500 text-xs">— enter a new token below to replace it</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {selectedAgentData?.hasTelegram ? 'New Bot Token (replaces existing)' : 'Bot Token'}
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHI..."
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:border-white focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={connectTelegram}
              disabled={connecting || !botToken || !selectedAgent}
              className="rounded-lg bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 w-full"
            >
              {connecting
                ? 'Connecting...'
                : selectedAgentData?.hasTelegram
                ? 'Update Telegram Bot'
                : 'Connect Telegram Bot'}
            </button>

            {result && (
              <div
                className={`rounded-lg border p-3 ${
                  result.ok
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <p className={`text-sm ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {result.ok ? '✅ ' : '❌ '}
                  {result.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discord Setup */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎮</span>
          <div>
            <h2 className="text-lg font-semibold text-white">Discord</h2>
            <p className="text-sm text-zinc-400">Add your agent to Discord servers</p>
          </div>
        </div>

        <button
          onClick={() => setShowDiscordSteps(!showDiscordSteps)}
          className="text-sm text-zinc-400 hover:text-white transition-colors mb-4 flex items-center gap-1"
        >
          {showDiscordSteps ? '▼' : '▶'} How to get a bot token (step-by-step)
        </button>

        {showDiscordSteps && (
          <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Setup Guide</h3>

            <div className="mb-5">
              <div className="flex items-start gap-3 mb-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Create a Discord application</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Open the Discord Developer Portal and click "New Application".
                  </p>
                </div>
              </div>
              <div className="ml-9">
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Open Discord Developer Portal →
                </a>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Add a bot</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    In your application, go to the "Bot" tab and click "Add Bot" (or "Reset Token" if one exists).
                    Enable the "Message Content Intent" under Privileged Gateway Intents.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Copy the token</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Click "Reset Token" (or "Copy") on the Bot page and paste it below. ↓
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Invite the bot to your server</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Use the "OAuth2 → URL Generator" tab, select the "bot" scope plus the permissions you want,
                    then open the generated URL to add the bot to your server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {agents.length === 0 ? (
          <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-center">
            <p className="text-sm text-zinc-400">
              You need a running agent first.{' '}
              <a href="/dashboard/agents" className="text-white hover:underline">
                Deploy one →
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedAgentData?.hasDiscord && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-2">
                <span className="text-blue-400 text-sm font-medium">Discord connected</span>
                <span className="text-zinc-500 text-xs">— enter a new token below to replace it</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {selectedAgentData?.hasDiscord ? 'New Bot Token (replaces existing)' : 'Bot Token'}
              </label>
              <input
                type="text"
                value={discordToken}
                onChange={(e) => setDiscordToken(e.target.value)}
                placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4.Abc123.Xyz..."
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:border-white focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={connectDiscord}
              disabled={connectingDiscord || !discordToken || !selectedAgent}
              className="rounded-lg bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 w-full"
            >
              {connectingDiscord
                ? 'Connecting...'
                : selectedAgentData?.hasDiscord
                ? 'Update Discord Bot'
                : 'Connect Discord Bot'}
            </button>

            {discordResult && (
              <div
                className={`rounded-lg border p-3 ${
                  discordResult.ok
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <p className={`text-sm ${discordResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {discordResult.ok ? '✅ ' : '❌ '}
                  {discordResult.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slack Setup */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💬</span>
          <div>
            <h2 className="text-lg font-semibold text-white">Slack</h2>
            <p className="text-sm text-zinc-400">Bring your agent into Slack workspaces</p>
          </div>
        </div>

        <button
          onClick={() => setShowSlackSteps(!showSlackSteps)}
          className="text-sm text-zinc-400 hover:text-white transition-colors mb-4 flex items-center gap-1"
        >
          {showSlackSteps ? '▼' : '▶'} How to get a bot token (step-by-step)
        </button>

        {showSlackSteps && (
          <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Setup Guide</h3>

            <div className="mb-5">
              <div className="flex items-start gap-3 mb-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Create a Slack app</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Open the Slack API apps page and click "Create New App" → "From scratch".
                  </p>
                </div>
              </div>
              <div className="ml-9">
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Open Slack Apps →
                </a>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Add bot scopes</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Under "OAuth & Permissions", add Bot Token Scopes such as{' '}
                    <code className="text-xs text-green-400">chat:write</code>,{' '}
                    <code className="text-xs text-green-400">app_mentions:read</code> and{' '}
                    <code className="text-xs text-green-400">channels:history</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Install to workspace</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Click "Install to Workspace" at the top of the "OAuth & Permissions" page and authorize the app.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Copy the Bot User OAuth Token</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Back on "OAuth & Permissions", copy the token that starts with:
                  </p>
                  <div className="mt-2 rounded bg-zinc-800 border border-zinc-700 px-3 py-1.5">
                    <code className="text-xs text-yellow-400">xoxb-...</code>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Paste it below. ↓</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {agents.length === 0 ? (
          <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-center">
            <p className="text-sm text-zinc-400">
              You need a running agent first.{' '}
              <a href="/dashboard/agents" className="text-white hover:underline">
                Deploy one →
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedAgentData?.hasSlack && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-2">
                <span className="text-blue-400 text-sm font-medium">Slack connected</span>
                <span className="text-zinc-500 text-xs">— enter a new token below to replace it</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {selectedAgentData?.hasSlack ? 'New Bot Token (replaces existing)' : 'Bot Token'}
              </label>
              <input
                type="text"
                value={slackToken}
                onChange={(e) => setSlackToken(e.target.value)}
                placeholder="xoxb-..."
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:border-white focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={connectSlack}
              disabled={connectingSlack || !slackToken || !selectedAgent}
              className="rounded-lg bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 w-full"
            >
              {connectingSlack
                ? 'Connecting...'
                : selectedAgentData?.hasSlack
                ? 'Update Slack Bot'
                : 'Connect Slack Bot'}
            </button>

            {slackResult && (
              <div
                className={`rounded-lg border p-3 ${
                  slackResult.ok
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <p className={`text-sm ${slackResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {slackResult.ok ? '✅ ' : '❌ '}
                  {slackResult.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
