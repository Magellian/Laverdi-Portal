'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'

const TABS = [
  { id: 'docs', label: 'Instructions/Docs', icon: '📚' },
  { id: 'plan', label: 'Your Plan', icon: '💳' },
  { id: 'org', label: 'Org', icon: '🏢' },
  { id: 'board', label: 'Board', icon: '📋' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function WorkspaceTabs({
  plan,
  org,
  board,
  docs,
}: {
  plan: ReactNode
  org: ReactNode
  board: ReactNode
  docs: ReactNode
}) {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId) || 'plan'
  const [active, setActive] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'plan'
  )

  useEffect(() => {
    const t = searchParams.get('tab') as TabId
    if (t && TABS.some((tab) => tab.id === t)) setActive(t)
  }, [searchParams])

  const content: Record<TabId, ReactNode> = { plan, org, board, docs }

  return (
    <div>
      <div className="px-8 pt-8">
        <h1 className="text-2xl font-bold text-white mb-1">Workspace</h1>
        <p className="text-zinc-400 mb-6">Your plan, organization, project board, and docs.</p>

        <div className="flex gap-1 border-b border-zinc-800 mb-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>{content[active]}</div>
    </div>
  )
}
