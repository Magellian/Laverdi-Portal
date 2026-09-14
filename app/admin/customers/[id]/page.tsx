'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Subscription {
  id: string
  tier: string
  status: string
  stripeSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
}

interface Instance {
  id: string
  name: string | null
  status: string
  port: number | null
  tier: string | null
  modelPrimary: string | null
  createdAt: string
}

interface UsageRow {
  model: string
  totalTokens: number
}

interface UserDetail {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  stripeCustomerId: string | null
  subscriptions: Subscription[]
  instances: Instance[]
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-900/50 text-emerald-400',
  trialing: 'bg-yellow-900/50 text-yellow-400',
  canceled: 'bg-zinc-800 text-zinc-300',
  past_due: 'bg-red-900/50 text-red-400',
  running: 'bg-emerald-900/50 text-emerald-400',
  provisioning: 'bg-yellow-900/50 text-yellow-400',
  stopped: 'bg-zinc-800 text-zinc-300',
  error: 'bg-red-900/50 text-red-400',
}

function Badge({ status }: { status: string | null }) {
  const label = status || 'none'
  const style = STATUS_STYLES[label] || 'bg-zinc-800 text-zinc-300'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : '—'
}

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [usage, setUsage] = useState<UsageRow[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setUser(data.user)
      setUsage(data.usage || [])
      setTotalTokens(data.totalTokens || 0)
    } catch {
      setError('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const sub = user?.subscriptions[0]

  const toggleBilling = async () => {
    if (!sub) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd: !sub.cancelAtPeriodEnd }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update billing')
        return
      }
      await load()
    } catch {
      setError('Failed to update billing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white p-8">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className="bg-black min-h-screen text-white p-8">
        <Link href="/admin/customers" className="text-zinc-400 hover:text-white text-sm">
          ← Back to customers
        </Link>
        <p className="mt-6 text-zinc-400">Customer not found.</p>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <Link href="/admin/customers" className="text-zinc-400 hover:text-white text-sm">
        ← Back to customers
      </Link>

      <h1 className="text-2xl font-bold text-white mt-4 mb-6">{user.email}</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Customer Info</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Email</dt>
              <dd className="text-white text-right break-all">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Name</dt>
              <dd className="text-white text-right">{user.name || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Role</dt>
              <dd className="text-white text-right capitalize">{user.role}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Joined</dt>
              <dd className="text-white text-right">{fmtDate(user.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Stripe ID</dt>
              <dd className="text-white text-right break-all">{user.stripeCustomerId || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Subscription */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Subscription</h2>
          {!sub ? (
            <p className="text-sm text-zinc-400">No subscription.</p>
          ) : (
            <>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Plan</dt>
                  <dd className="text-white text-right capitalize">{sub.tier}</dd>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <dt className="text-zinc-400">Status</dt>
                  <dd className="text-right">
                    <Badge status={sub.status} />
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Period Start</dt>
                  <dd className="text-white text-right">{fmtDate(sub.currentPeriodStart)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Period End</dt>
                  <dd className="text-white text-right">{fmtDate(sub.currentPeriodEnd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Cancel at period end</dt>
                  <dd className="text-white text-right">{sub.cancelAtPeriodEnd ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
              <button
                onClick={toggleBilling}
                disabled={saving}
                className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  sub.cancelAtPeriodEnd
                    ? 'bg-white text-black hover:bg-zinc-100'
                    : 'bg-red-600 text-white hover:bg-red-500'
                }`}
              >
                {saving
                  ? 'Saving...'
                  : sub.cancelAtPeriodEnd
                  ? 'Resume Billing'
                  : 'Pause Billing'}
              </button>
            </>
          )}
        </div>

        {/* Agent instances */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Agent Instances</h2>
          {user.instances.length === 0 ? (
            <p className="text-sm text-zinc-400">No instances.</p>
          ) : (
            <div className="space-y-3">
              {user.instances.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between border-b border-zinc-800 last:border-0 pb-3 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {i.name || `Agent ${i.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {i.modelPrimary?.split('/')[1] || '—'} · port {i.port ?? '—'}
                    </p>
                  </div>
                  <Badge status={i.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Usage Summary</h2>
          {usage.length === 0 ? (
            <p className="text-sm text-zinc-400">No usage recorded.</p>
          ) : (
            <>
              <p className="text-sm text-zinc-400 mb-3">
                Total: <span className="text-white font-semibold">{totalTokens.toLocaleString()}</span> tokens
              </p>
              <div className="space-y-2">
                {usage.map((u) => (
                  <div key={u.model} className="flex justify-between text-sm">
                    <span className="text-zinc-300 truncate">{u.model}</span>
                    <span className="text-zinc-400">{u.totalTokens.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
