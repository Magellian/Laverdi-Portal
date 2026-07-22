import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import StatusBadge from '@/components/admin/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    activeSubscriptions,
    trialSubscriptions,
    totalAgents,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'trialing' } }),
    prisma.instance.count({ where: { status: { in: ['provisioning', 'running'] } } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { tier: true, status: true },
        },
      },
    }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers },
    { label: 'Active Subscriptions', value: activeSubscriptions },
    { label: 'Trial Users', value: trialSubscriptions },
    { label: 'Active Agents', value: totalAgents },
  ]

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="mt-1 text-zinc-400">Platform-wide metrics and recent activity</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
          >
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent signups */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Signups</h2>
          <Link href="/admin/customers" className="text-sm text-zinc-400 hover:text-white">
            View all →
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <p className="text-zinc-400 text-sm">No users yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {recentUsers.map((u) => {
              const sub = u.subscriptions[0]
              return (
                <Link
                  key={u.id}
                  href={`/admin/customers/${u.id}`}
                  className="flex items-center justify-between py-3 hover:bg-zinc-800/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{u.email}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {u.name || '—'} · joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-zinc-400 capitalize">{sub?.tier || 'no plan'}</span>
                    <StatusBadge status={sub?.status} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
