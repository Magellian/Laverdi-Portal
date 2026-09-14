'use client'

import { useEffect, useState } from 'react'

interface DiscountCode {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number | null
  maxUses: number | null
  currentUses: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Form fields
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'free'>('percentage')
  const [discountValue, setDiscountValue] = useState('50')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/admin/discounts')
      const data = await res.json()
      setCodes(data.codes || [])
    } catch {
      setError('Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setCode('')
    setDescription('')
    setDiscountType('percentage')
    setDiscountValue('50')
    setMaxUses('')
    setExpiresAt('')
  }

  const createCode = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code || undefined,
          description: description || undefined,
          discountType,
          discountValue: discountType === 'percentage' ? Number(discountValue) : undefined,
          maxUses: maxUses ? Number(maxUses) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create code')
        return
      }
      setShowForm(false)
      resetForm()
      await load()
    } catch {
      setError('Failed to create code')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (c: DiscountCode) => {
    try {
      await fetch(`/api/admin/discounts/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })
      await load()
    } catch {
      setError('Failed to toggle code')
    }
  }

  const deleteCode = async (c: DiscountCode) => {
    if (!confirm(`Delete code ${c.code}? This cannot be undone.`)) return
    try {
      await fetch(`/api/admin/discounts/${c.id}`, { method: 'DELETE' })
      await load()
    } catch {
      setError('Failed to delete code')
    }
  }

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Discount Codes</h1>
          <p className="mt-1 text-zinc-400">Create and manage promo codes</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Code'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-300 mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Discount Code</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Code (leave blank to auto-generate)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="LAVERDI-XXXXX"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Launch promo"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('free')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                    discountType === 'free'
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Free
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Discount %</label>
              <input
                type="number"
                min={1}
                max={100}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                disabled={discountType === 'free'}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none disabled:opacity-40"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Expiry Date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={createCode}
              disabled={saving}
              className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Codes table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-zinc-400 border-b border-zinc-800">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Uses</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Loading...</td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No discount codes yet.</td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="text-xs text-zinc-500 hover:text-white"
                        title="Copy to clipboard"
                      >
                        {copied === c.code ? '✓' : '📋'}
                      </button>
                    </div>
                    {c.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 capitalize">{c.discountType}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {c.discountType === 'free' ? 'Free' : `${c.discountValue}%`}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {c.currentUses}/{c.maxUses ?? '∞'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        c.isActive ? 'bg-emerald-600' : 'bg-zinc-700'
                      }`}
                      aria-label="Toggle active"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          c.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteCode(c)}
                      className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs font-medium hover:bg-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
