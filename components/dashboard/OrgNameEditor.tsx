'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrgNameEditor({ orgId, name }: { orgId: string; name: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (value.trim().length === 0 || value.trim() === name) {
      setEditing(false)
      setValue(name)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/orgs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orgId, name: value.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update organization')
        return
      }

      setEditing(false)
      router.refresh()
    } catch {
      setError('Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') { setEditing(false); setValue(name) }
            }}
            autoFocus
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xl font-bold text-white focus:border-white focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-white text-black px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(name) }}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-bold text-white">{name}</h1>
      <button
        onClick={() => setEditing(true)}
        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        Edit
      </button>
    </div>
  )
}
