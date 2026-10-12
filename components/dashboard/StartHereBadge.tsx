'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'laverdi_start_here_dismissed'

export default function StartHereBadge({ agentCount }: { agentCount: number }) {
  const [dismissed, setDismissed] = useState(true) // default hidden until we know localStorage state (avoids SSR flash)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  // Only show for brand-new accounts with no agents yet, and only once we've
  // checked localStorage client-side (mounted) to avoid a server/client mismatch.
  if (!mounted || dismissed || agentCount > 0) return null

  return (
    <div
      role="status"
      className="absolute left-full top-1 ml-3 z-20 w-56 animate-[pulse_3s_ease-in-out_infinite]"
    >
      <div className="relative rounded-lg bg-amber-400 text-black px-3 py-2 shadow-lg">
        {/* Pointer arrow on the left edge */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 bg-amber-400" />
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-tight">Start here 👋</p>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 text-black/60 hover:text-black text-xs leading-none mt-0.5"
          >
            ✕
          </button>
        </div>
        <p className="text-xs leading-snug mt-1">
          Create your first agent, connect a channel, and get the companion app — all right here.
        </p>
      </div>
    </div>
  )
}
