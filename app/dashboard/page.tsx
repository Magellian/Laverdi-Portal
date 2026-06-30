import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  // Get real stats
  const userId = session?.user?.id

  const [agentCount, subscription] = await Promise.all([
    userId
      ? prisma.instance.count({
          where: { ownerId: userId, status: { in: ['provisioning', 'running'] } },
        })
      : 0,
    userId
      ? prisma.subscription.findFirst({
          where: { userId, status: { in: ['active', 'trialing'] } },
          orderBy: { createdAt: 'desc' },
        })
      : null,
  ])

  const stats = [
    { label: 'Active Agents', value: String(agentCount), href: '/dashboard/agents' },
    { label: 'Plan', value: subscription?.tier ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1) : 'None', href: '/dashboard/plan' },
    { label: 'Status', value: subscription?.status === 'active' ? 'Active' : subscription?.status || 'No subscription', href: '/dashboard/plan' },
    {
      label: 'Renews',
      value: subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
        : '—',
      href: '/dashboard/plan',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-zinc-400">
          Welcome back, {session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
          >
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/agents"
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
          >
            <span className="text-3xl mb-3 block">🤖</span>
            <h3 className="text-sm font-semibold text-white mb-1">Deploy Agent</h3>
            <p className="text-sm text-zinc-400">Spin up a new AI agent in seconds</p>
          </Link>
          <Link
            href="/dashboard/channels"
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
          >
            <span className="text-3xl mb-3 block">🔌</span>
            <h3 className="text-sm font-semibold text-white mb-1">Connect Channel</h3>
            <p className="text-sm text-zinc-400">Link Telegram, Discord, or Slack</p>
          </Link>
          <Link
            href="/dashboard/plan"
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
          >
            <span className="text-3xl mb-3 block">📊</span>
            <h3 className="text-sm font-semibold text-white mb-1">View Usage</h3>
            <p className="text-sm text-zinc-400">Check your plan and usage stats</p>
          </Link>
        </div>
      </div>

      {/* Getting Started (show only when no agents) */}
      {agentCount === 0 && (
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">1</span>
              <div>
                <p className="text-sm font-medium text-zinc-300">Deploy your first agent</p>
                <p className="text-sm text-zinc-500">Go to Agents → Deploy New Agent</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center font-bold">2</span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Connect a messaging platform</p>
                <p className="text-sm text-zinc-600">Telegram, Discord, or Slack</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center font-bold">3</span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Start chatting with your agent</p>
                <p className="text-sm text-zinc-600">Available 24/7 on your connected platforms</p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
