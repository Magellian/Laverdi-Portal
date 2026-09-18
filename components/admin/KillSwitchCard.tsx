'use client'

import { useState } from 'react'

/**
 * Step 7 narrow-beta safety net: one lever that instantly stops all
 * delegation across every instance (see lib/kill-switch.ts). No redeploy,
 * takes effect on the very next job-creation call or companion heartbeat.
 */
export default function KillSwitchCard({ initialActive }: { initialActive: boolean }) {
  const [active, setActive] = useState(initialActive)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  async function apply(next: boolean) {
    setPending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/kill-switch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegationKillSwitch: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const data = await res.json()
      setActive(data.delegationKillSwitch)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update kill switch')
    } finally {
      setPending(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        active ? 'bg-red-900/30 border-red-800' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">Delegation Kill Switch</p>
          <p className={`mt-1 font-mono text-sm ${active ? 'text-red-400' : 'text-white'}`}>
            {active ? 'ON — all delegation is blocked platform-wide' : 'OFF — delegation working normally'}
          </p>
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={pending}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              active
                ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                : 'bg-red-700 text-white hover:bg-red-600'
            }`}
          >
            {active ? 'Turn off' : 'Turn on'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {active ? 'Resume delegation for everyone?' : 'Block delegation for everyone?'}
            </span>
            <button
              onClick={() => apply(!active)}
              disabled={pending}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {pending ? 'Working...' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
