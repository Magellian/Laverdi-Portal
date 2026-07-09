'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateOrgButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Organization' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create organization')
        return
      }

      router.refresh()
    } catch {
      setError('Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Organization'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
