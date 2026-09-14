'use client'

import { useState } from 'react'

interface Agent {
  id: string
  name: string | null
  status: string
  port: number | null
  tier: string | null
  modelPrimary: string | null
  modelFallback: string | null
  apiKey: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-green-500/10 border-green-500/20 text-green-400',
  provisioning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  stopped: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
}

export default function AgentDetailClient({ agent: initialAgent }: { agent: Agent }) {
  const [agent, setAgent] = useState(initialAgent)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(agent.name || '')
  const [savingName, setSavingName] = useState(false)
  const [revealKey, setRevealKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveName = async () => {
    setSavingName(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameDraft || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update name')
        return
      }
      setAgent((prev) => ({ ...prev, name: data.instance.name }))
      setEditingName(false)
    } catch {
      setError('Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const copyApiKey = async () => {
    if (!agent.apiKey) return
    try {
      await navigator.clipboard.writeText(agent.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const maskedKey = agent.apiKey ? `${agent.apiKey.slice(0, 6)}${'•'.repeat(24)}` : '—'

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-300 mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview card */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1.5">Agent Name</label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder={`Agent ${agent.id.slice(0, 8)}`}
                  autoFocus
                  className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-white text-lg font-semibold focus:border-white focus:outline-none"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="rounded-lg bg-white text-black px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setNameDraft(agent.name || '')
                  }}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">
                  {agent.name || `Agent ${agent.id.slice(0, 8)}`}
                </h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">ID: {agent.id}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[agent.status] || STATUS_COLORS.stopped}`}>
            {agent.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500">Primary Model</p>
            <p className="text-sm text-zinc-300">{agent.modelPrimary || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Fallback Model</p>
            <p className="text-sm text-zinc-300">{agent.modelFallback || '—'}</p>
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
            <p className="text-sm text-zinc-300">{new Date(agent.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* API Key card */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">API Key</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Use this key to access your agent externally.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <code className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 font-mono break-all">
            {agent.apiKey ? (revealKey ? agent.apiKey : maskedKey) : 'No API key set'}
          </code>
          {agent.apiKey && (
            <>
              <button
                onClick={() => setRevealKey((v) => !v)}
                className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {revealKey ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={copyApiKey}
                className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}
        </div>

        <button
          disabled
          title="Coming soon"
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
        >
          Regenerate Key — Coming Soon
        </button>
      </div>
    </div>
  )
}
