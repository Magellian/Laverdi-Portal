'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CreditBalanceChip() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/credits/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setBalance(data.balance)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (balance === null) return null

  return (
    <Link
      href="/dashboard/workspace?tab=plan"
      title="Credits for image/video generation -- click to buy more"
      className="mx-3 mb-3 flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
    >
      <span className="flex items-center gap-1.5">
        <span>✨</span> Credits
      </span>
      <span className="font-semibold">{balance.toLocaleString()}</span>
    </Link>
  )
}
