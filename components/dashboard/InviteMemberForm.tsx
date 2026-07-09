'use client'

import { useState } from 'react'

export default function InviteMemberForm() {
  const [email, setEmail] = useState('')

  return (
    <div className="flex gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@company.com"
        className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
      />
      <button
        onClick={() => alert('Coming Soon')}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        Coming Soon
      </button>
    </div>
  )
}
