'use client'

import { useEffect, useState } from 'react'

interface Row {
  userId: string
  email: string | null
  name: string | null
  creditsSpent: number
  jobCount: number
  currentBalance: number
  flagged: boolean
}

const RANGES = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
]

export default function AdminCreditsPage() {
  const [days, setDays] = useState(1)
  const [rows, setRows] = useState<Row[]>([])
  const [threshold, setThreshold] = useState(300)
  const [totalCreditsSpent, setTotalCreditsSpent] = useState(0)
  const [flaggedCount, setFlaggedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/credits?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || [])
        setThreshold(data.threshold ?? 300)
        setTotalCreditsSpent(data.totalCreditsSpent ?? 0)
        setFlaggedCount(data.flaggedCount ?? 0)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [days])

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Credits</h1>
          <p className="mt-1 text-zinc-400">
            Media-generation credit spend by account &middot; accounts over {threshold} credits in the window are
            flagged
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === r.days ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <p className="text-sm text-zinc-400">Total credits spent</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalCreditsSpent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <p className="text-sm text-zinc-400">Accounts spending</p>
          <p className="mt-2 text-3xl font-bold text-white">{rows.length}</p>
        </div>
        <div className="rounded-xl border p-6 border-red-500/20 bg-red-500/5">
          <p className="text-sm text-zinc-400">Flagged (&gt;{threshold})</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{flaggedCount}</p>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-400">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Credits spent</th>
              <th className="px-4 py-3 font-medium">Jobs</th>
              <th className="px-4 py-3 font-medium">Current balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  No credit spend in this window.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId} className={`border-b border-zinc-800/50 ${row.flagged ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={row.flagged ? 'text-red-400 font-medium' : 'text-zinc-200'}>
                      {row.email || row.userId}
                    </span>
                    {row.flagged && <span className="ml-2 text-xs text-red-400">⚠ flagged</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{row.creditsSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-300">{row.jobCount}</td>
                  <td className="px-4 py-3 text-zinc-300">{row.currentBalance.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
