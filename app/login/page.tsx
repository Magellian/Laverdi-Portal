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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-zinc-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
          <p className="text-zinc-400 mb-2">
            We sent a sign-in link to <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            Click the link in the email to sign in. Check your spam folder if you don't see it.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-zinc-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">LaVerdi</h2>
          <p className="mt-2 text-zinc-400">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1">
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
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-white focus:outline-none text-sm"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-white text-black py-2.5 px-4 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sending link...' : 'Sign in with Email'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          We'll send you a magic link to sign in. No password needed.
        </p>
      </div>
    </div>
  )
}
