'use client'

import { useEffect, useState } from 'react'

interface Agent {
  id: string
  name: string | null
  status: string
  port: number | null
  tier: string | null
  modelPrimary: string | null
  hasTelegram: boolean
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-green-500/10 border-green-500/20 text-green-400',
  provisioning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  stopped: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tier, setTier] = useState<string>('starter')
  const [maxAgents, setMaxAgents] = useState<number>(1)
  const [agentCount, setAgentCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [newName, setNewName] = useState('')
  const [showDeploy, setShowDeploy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data.instances || [])
      setTier(data.tier || 'starter')
      setMaxAgents(data.maxAgents ?? 1)
      setAgentCount(data.agentCount ?? 0)
    } catch {
      setError('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [])

  const atLimit = maxAgents > 0 && agentCount >= maxAgents

  const deployAgent = async () => {
    setDeploying(true)
    setError(null)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to deploy agent')
        return
      }

      setShowDeploy(false)
      setNewName('')
      await fetchAgents()
    } catch {
      setError('Failed to deploy agent')
    } finally {
      setDeploying(false)
    }
  }

  const deleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent? This cannot be undone.')) return

    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' })
      await fetchAgents()
    } catch {
      setError('Failed to delete agent')
    }
  }

  const retryAgent = async (id: string) => {
    if (!confirm('Retry provisioning this agent?')) return
    try {
      const res = await fetch(`/api/agents/${id}/retry`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to retry')
        return
      }
      await fetchAgents()
    } catch {
      setError('Failed to retry provisioning')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Your Agents</h1>
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Agents</h1>
          <p className="mt-1 text-zinc-400">
            Manage and deploy your AI agents
            {' · '}
            <span className={atLimit ? 'text-red-400' : 'text-zinc-500'}>
              {agentCount}/{maxAgents} used
            </span>
            {' · '}
            <span className="text-zinc-500 capitalize">{tier} plan</span>
          </p>
        </div>
        <button
          onClick={() => {
            if (atLimit) {
              setError(`Agent limit reached (${agentCount}/${maxAgents}). Upgrade your plan for more.`)
            } else {
              setShowDeploy(true)
            }
          }}
          disabled={deploying}
          title={atLimit ? `Limit reached: ${agentCount}/${maxAgents} agents` : 'Deploy a new agent'}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            atLimit
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-white text-black hover:bg-zinc-100'
          }`}
        >
          Deploy New Agent
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-300 mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Deploy Modal */}
      {showDeploy && !atLimit && (
        <div className="mb-8 rounded-xl border border-zinc-700 bg-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Deploy New Agent</h2>
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">Agent Name (optional)</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Assistant, Work Bot..."
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={deployAgent}
              disabled={deploying}
              className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {deploying ? 'Deploying...' : 'Deploy'}
            </button>
            <button
              onClick={() => { setShowDeploy(false); setNewName('') }}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 px-8 py-16 text-center">
          <span className="mb-4 text-6xl">🤖</span>
          <h2 className="mb-2 text-xl font-semibold text-white">No agents deployed yet</h2>
          <p className="mb-6 max-w-sm text-sm text-zinc-400">
            Deploy your first AI agent to get started. It'll be ready in about a minute.
          </p>
          <button
            onClick={() => setShowDeploy(true)}
            className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            Deploy Your First Agent
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <a
                    href={`/dashboard/agents/${agent.id}`}
                    className="text-lg font-semibold text-white hover:underline"
                  >
                    {agent.name || `Agent ${agent.id.slice(0, 8)}`}
                  </a>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    ID: {agent.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {agent.hasTelegram && (
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                      Telegram
                    </span>
                  )}
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[agent.status] || STATUS_COLORS.stopped}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-500">Model</p>
                  <p className="text-sm text-zinc-300">{agent.modelPrimary?.split('/')[1] || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Tier</p>
                  <p className="text-sm text-zinc-300 capitalize">{agent.tier || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Port</p>
                  <p className="text-sm text-zinc-300">{agent.port || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Created</p>
                  <p className="text-sm text-zinc-300">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {agent.status === 'running' && agent.port && (
                  <a
                    href={`/agent/${agent.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white text-black px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 transition-colors"
                  >
                    Open Agent
                  </a>
                )}
                <a
                  href="/dashboard/channels"
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {agent.hasTelegram ? 'Manage Channels' : 'Connect Telegram'}
                </a>
                <a
                  href={`/dashboard/agents/${agent.id}`}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Settings
                </a>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
                {(['provisioning', 'error'].includes(agent.status)) && (
                  <button
                    onClick={() => retryAgent(agent.id)}
                    className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                  >
                    ↻ Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
