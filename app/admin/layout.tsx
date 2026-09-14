import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import Link from 'next/link'

const navItems = [
  { label: 'Overview', href: '/admin/dashboard' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Agents', href: '/admin/agents' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'System Health', href: '/admin/health' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const isAuthenticated = token ? verifyAdminToken(token) : false

  // Show minimal layout for login page (no sidebar)
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-black">
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col">
        <h2 className="text-lg font-bold text-white mb-6">LaVerdi Admin</h2>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="POST">
          <button className="w-full px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors text-sm text-left">
            Sign Out
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
