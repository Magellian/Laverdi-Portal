import { prisma } from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const [userCount, agentCount, activeSubCount, runningAgents] = await Promise.all([
    prisma.user.count(),
    prisma.instance.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.instance.count({ where: { status: 'running' } }),
  ])

  const tierCounts = await prisma.subscription.groupBy({
    by: ['tier'],
    where: { status: 'active' },
    _count: true,
  })

  const stats = [
    { label: 'Total Users', value: String(userCount) },
    { label: 'Total Agents', value: `${runningAgents} running / ${agentCount} total` },
    { label: 'Active Subscriptions', value: String(activeSubCount) },
    {
      label: 'By Tier',
      value: tierCounts.map((t) => `${t.tier}: ${t._count}`).join(', ') || 'None',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <p className="text-sm text-zinc-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
