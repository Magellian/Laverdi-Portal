'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface SessionDetails {
  customerEmail: string | null
  tier: string | null
  status: string | null
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [details, setDetails] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/billing/session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setDetails(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <svg
              className="w-10 h-10 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            You're In!
          </h1>

          {loading ? (
            <p className="text-zinc-400 text-lg">Setting up your account...</p>
          ) : details?.customerEmail ? (
            <div className="space-y-2">
              <p className="text-zinc-300 text-lg">
                Welcome aboard, <span className="text-white font-medium">{details.customerEmail}</span>
              </p>
              {details.tier && (
                <p className="text-zinc-400">
                  Plan: <span className="text-white font-medium capitalize">{details.tier}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-zinc-300 text-lg">
              Your subscription is being activated.
            </p>
          )}
        </div>

        {/* What's Next */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">What happens next</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center font-medium">1</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Check your email</p>
                <p className="text-zinc-500 text-sm">You'll get a confirmation with your receipt and login link.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center font-medium">2</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Sign into your dashboard</p>
                <p className="text-zinc-500 text-sm">Provision your first AI agent and connect your platforms.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center font-medium">3</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Start chatting</p>
                <p className="text-zinc-500 text-sm">Your agent is ready. Connect it to Telegram, Discord, or Slack.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-block border border-zinc-700 text-zinc-300 px-6 py-3 rounded-lg font-semibold hover:border-zinc-500 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center">
          <p className="text-zinc-400 text-lg">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
