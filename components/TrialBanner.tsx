import { useState, useEffect } from 'react'
import Link from 'next/link'

const DISMISSED_KEY = 'trial-banner-dismissed'

interface TrialBannerProps {
  tier: string
  trialExpiresAt?: string | null
}

export function TrialBanner({ tier, trialExpiresAt }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem(DISMISSED_KEY) === 'true') {
      setDismissed(true)
    }
  }, [])

  // Avoid SSR mismatch — render nothing until the client has checked localStorage
  if (!mounted || dismissed) return null
  // Show banner for free tier, trial tier, or starter tier with active trial (not yet converted)
  const isActiveTrial = trialExpiresAt && !dismissed && tier === 'starter'
  if (tier !== 'trial' && tier !== 'free' && !isActiveTrial) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  let daysLeft: number | null = null
  if (trialExpiresAt && (tier === 'trial' || isActiveTrial)) {
    const expiry = new Date(trialExpiresAt)
    daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
      <p className="text-sm">
        {(tier === 'trial' || isActiveTrial) && daysLeft !== null ? (
          <>
            <strong>Trial period:</strong> Your trial expires in {daysLeft}{' '}
            {daysLeft === 1 ? 'day' : 'days'}.{' '}
            <Link
              href="/checkout?plan=starter"
              className="underline font-semibold hover:text-red-200"
            >
              Upgrade now →
            </Link>
          </>
        ) : (
          <>
            <strong>Free plan</strong> — You are on the free tier. Upgrade to unlock higher limits.{' '}
            <Link
              href="/checkout?plan=starter"
              className="underline font-semibold hover:text-red-200"
            >
              Upgrade now →
            </Link>
          </>
        )}
      </p>
      <button
        onClick={handleDismiss}
        className="ml-4 text-white hover:text-red-200 text-xl font-bold leading-none flex-shrink-0"
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  )
}
