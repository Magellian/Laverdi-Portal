'use client'

import { useEffect, useState } from 'react'

interface ModelRow {
  model: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
}

interface TopUser {
  userId: string
  email: string | null
  name: string | null
  totalTokens: number
}

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function UsagePage() {
  const [days, setDays] = useState(30)
  const [userId, setUserId] = useState<string | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [modelBreakdown, setModelBreakdown] = useState<ModelRow[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: String(days) })
      if (userId) params.set('userId', userId)
      const res = await fetch(`/api/admin/usage?${params.toString()}`)
      const data = await res.json()
      setTotalTokens(data.totalTokens || 0)
      setModelBreakdown(data.modelBreakdown || [])
      setTopUsers(data.topUsers || [])
    } catch {
      setModelBreakdown([])
      setTopUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, userId])

  const maxUserTokens = Math.max(1, ...topUsers.map((u) => u.totalTokens))
  const selectedUser = topUsers.find((u) => u.userId === userId)

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usage</h1>
          <p className="mt-1 text-zinc-400">
            Inference token usage across the platform
            {selectedUser && (
              <>
                {' · '}
                <span className="text-white">{selectedUser.email || selectedUser.userId}</span>
                <button
                  onClick={() => setUserId(null)}
                  className="ml-2 text-xs text-zinc-400 hover:text-white underline"
                >
                  clear filter
                </button>
              </>
            )}
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                days === r.days
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total tokens card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <p className="text-sm text-zinc-400">Total Tokens ({days}d)</p>
        <p className="mt-2 text-3xl font-bold text-white">
          {loading ? '…' : totalTokens.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top users bar chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Users by Usage</h2>
          {topUsers.length === 0 ? (
            <p className="text-sm text-zinc-400">No usage data.</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => setUserId(u.userId)}
                  className="w-full text-left group"
                  title="Filter by this user"
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 truncate group-hover:text-white">
                      {u.email || u.name || u.userId.slice(0, 12)}
                    </span>
                    <span className="text-zinc-400">{u.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors"
                      style={{ width: `${(u.totalTokens / maxUserTokens) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {selectedUser ? 'Model Breakdown (user)' : 'Model Breakdown'}
          </h2>
          {modelBreakdown.length === 0 ? (
            <p className="text-sm text-zinc-400">No usage data.</p>
          ) : (
            <div className="space-y-3">
              {modelBreakdown.map((m) => (
                <div key={m.model} className="border-b border-zinc-800 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300 truncate">{m.model}</span>
                    <span className="text-white font-medium">{m.totalTokens.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {m.promptTokens.toLocaleString()} prompt · {m.completionTokens.toLocaleString()} completion
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
