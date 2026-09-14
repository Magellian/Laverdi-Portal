'use client'

import { signIn } from 'next-auth/react'
import { FormEvent, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('email', {
        email,
        callbackUrl: '/dashboard',
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to send sign-in link. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] marble-bg px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20 mb-6">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
          <p className="text-[var(--muted)] mb-2">
            We sent a sign-in link to <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-[var(--muted)] text-sm mb-6 opacity-70">
            Click the link in the email to sign in. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] marble-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-5 gold-glow">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 14L8 16L12 12L16 16L20 14L12 4Z" fill="var(--accent)" opacity="0.8"/>
              <path d="M12 4V12M12 12L8 16M12 12L16 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mt-4">LaVerdi</h2>
          <p className="mt-2 text-[var(--muted)]">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-3">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--muted)] mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none text-sm transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[var(--accent)] text-[#0a1628] py-2.5 px-4 text-sm font-semibold hover:bg-[var(--accent-glow)] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Sending link...' : 'Sign in with Email'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)] opacity-60">
          We&apos;ll send you a magic link to sign in. No password needed.
        </p>

        <div className="text-center mt-8">
          <a href="/" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            &larr; Back to home
          </a>
        </div>
      </div>
    </div>
  )
}