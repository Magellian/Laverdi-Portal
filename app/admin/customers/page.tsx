'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CustomerRow {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  tier: string | null
  status: string | null
  agentCount: number
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-900/50 text-emerald-400',
  trialing: 'bg-yellow-900/50 text-yellow-400',
  canceled: 'bg-zinc-800 text-zinc-300',
  past_due: 'bg-red-900/50 text-red-400',
}

function StatusBadge({ status }: { status: string | null }) {
  const label = status || 'none'
  const style = STATUS_STYLES[label] || 'bg-zinc-800 text-zinc-300'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

export default function CustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (debounced) params.set('search', debounced)
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setRows(data.users || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debounced, page])

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="mt-1 text-zinc-400">{total} total users</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or name..."
        className="w-full max-w-md mb-6 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-zinc-400 border-b border-zinc-800">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Agents</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${r.id}`} className="text-white hover:underline">
                      {r.email}
                    </Link>
                    {r.role === 'admin' && (
                      <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{r.name || '—'}</td>
                  <td className="px-4 py-3 text-zinc-300 capitalize">{r.tier || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{r.agentCount}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${r.id}`}
                      className="text-zinc-400 hover:text-white"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-zinc-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
