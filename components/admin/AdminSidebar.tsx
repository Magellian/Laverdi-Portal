'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { label: 'Overview', href: '/admin', icon: '📊' },
  { label: 'Customers', href: '/admin/customers', icon: '👥' },
  { label: 'Discount Codes', href: '/admin/discounts', icon: '🏷️' },
  { label: 'Usage', href: '/admin/usage', icon: '📈' },
]

export default function AdminSidebar({ email }: { email: string | null | undefined }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActiveLink = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-zinc-800 flex-shrink-0">
        <span className="text-xl leading-none">🛡️</span>
        <span className="text-xl font-bold text-white tracking-tight">Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          const isActive = isActiveLink(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-4 flex-shrink-0">
        <p className="text-xs text-zinc-500 truncate mb-3">{email ?? '—'}</p>
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex w-full items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: sticky full-height sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 flex-shrink-0">
        {sidebar}
      </div>

      {/* Mobile: hamburger + slide-in overlay */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-zinc-300 hover:text-white"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="relative h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 text-zinc-400 hover:text-white"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebar}
          </div>
        </div>
      </div>
    </>
  )
}
