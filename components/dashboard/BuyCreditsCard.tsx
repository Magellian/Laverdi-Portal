'use client'

import { useEffect, useState } from 'react'

const PACKS = [
  { id: 'starter', label: 'Starter pack', credits: 100, price: '$4.99' },
  { id: 'creator', label: 'Creator pack', credits: 500, price: '$19.99' },
  { id: 'pro', label: 'Pro pack', credits: 2000, price: '$69.99' },
] as const

export default function BuyCreditsCard() {
  const [balance, setBalance] = useState<number | null>(null)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/credits/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBalance(data.balance))
      .catch(() => {})
  }, [])

  const buy = async (packId: string) => {
    setBuying(packId)
    setError(null)
    try {
      const res = await fetch('/api/billing/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout')
        setBuying(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not start checkout')
      setBuying(null)
    }
  }

  return (
    <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-white">Credits</h3>
        {balance !== null && (
          <span className="text-sm text-zinc-300">
            Balance: <span className="font-semibold text-white">{balance.toLocaleString()}</span>
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-400 mb-5">
        Credits pay for image and video generation through your agent &mdash; work on any plan, no tier upgrade
        needed. Video is saved straight to your own computer through the companion app, never stored on our
        servers.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => buy(pack.id)}
            disabled={buying !== null}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:border-zinc-500 transition-colors disabled:opacity-50"
          >
            <p className="text-sm font-semibold text-white">{pack.label}</p>
            <p className="text-xs text-zinc-400 mb-2">{pack.credits.toLocaleString()} credits</p>
            <p className="text-lg font-bold text-white">
              {buying === pack.id ? 'Starting…' : pack.price}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
