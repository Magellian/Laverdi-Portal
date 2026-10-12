'use client'

import { useState } from 'react'

interface Agent {
  id: string
  name: string | null
  status: string
}

export default function CreateAgentStep({
  tier,
  maxAgents,
  agentCount,
  onCreated,
}: {
  tier: string
  maxAgents: number
  agentCount: number
  onCreated: (agent: Agent) => void
}) {
  const [newName, setNewName] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setNewName('')
      onCreated(data.instance || data)
    } catch {
      setError('Failed to deploy agent')
    } finally {
      setDeploying(false)
    }
  }

  if (atLimit) {
    return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
        <p className="text-sm text-yellow-400">
          You&apos;ve reached your agent limit ({agentCount}/{maxAgents}) on the{' '}
          <span className="capitalize">{tier}</span> plan.{' '}
          <a href="/dashboard/workspace?tab=plan" className="underline hover:text-yellow-300">
            Upgrade for more →
          </a>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <span className="flex-shrink-0 text-4xl">🤖</span>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Create your agent</h2>
          <p className="text-sm text-zinc-400">
            An agent is your own private AI assistant, hosted and running 24/7. It&apos;ll be
            ready in about a minute.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
        <label className="block text-sm text-zinc-400 mb-2">Agent Name (optional)</label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. My Assistant, Work Bot..."
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-white text-sm focus:border-white focus:outline-none mb-4"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          id="tour-wizard-create-agent"
          onClick={deployAgent}
          disabled={deploying}
          className="w-full rounded-lg bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {deploying ? 'Creating your agent…' : 'Create Agent'}
        </button>
      </div>
    </div>
  )
}
