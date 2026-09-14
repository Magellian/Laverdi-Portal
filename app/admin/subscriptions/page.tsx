import { prisma } from '@/lib/prisma'

const STATUS_CHIPS = [
  { value: 'all', label: 'All', active: 'bg-white text-black' },
  { value: 'active', label: 'Active', active: 'bg-green-600 text-white' },
  { value: 'past_due', label: 'Past Due', active: 'bg-yellow-600 text-white' },
  { value: 'canceled', label: 'Canceled', active: 'bg-red-600 text-white' },
  { value: 'unpaid', label: 'Unpaid', active: 'bg-red-600 text-white' },
  { value: 'incomplete', label: 'Incomplete', active: 'bg-zinc-600 text-white' },
]

const TIER_CHIPS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  canceled: 'bg-red-900/50 text-red-400',
  unpaid: 'bg-red-900/50 text-red-400',
  past_due: 'bg-yellow-900/50 text-yellow-400',
  incomplete: 'bg-zinc-800 text-zinc-400',
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; status?: string }>
}) {
  const { tier: tierFilter, status: statusFilter } = await searchParams

  const where: { tier?: string; status?: string } = {}
  if (tierFilter && tierFilter !== 'all') where.tier = tierFilter
  if (statusFilter && statusFilter !== 'all') where.status = statusFilter

  const subscriptions = await prisma.subscription.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    where,
  })

  const withTier = (params: URLSearchParams) => {
    if (tierFilter && tierFilter !== 'all') params.set('tier', tierFilter)
    return params
  }
  const withStatus = (params: URLSearchParams) => {
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    return params
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Subscriptions</h1>

      <div className="flex flex-wrap gap-3 mb-3">
        {STATUS_CHIPS.map((chip) => {
          const isActive = (statusFilter || 'all') === chip.value
          const params = withTier(new URLSearchParams())
          if (chip.value !== 'all') params.set('status', chip.value)
          return (
            <a
              key={chip.value}
              href={`?${params}`}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                isActive ? chip.active : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {chip.label}
            </a>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {TIER_CHIPS.map((chip) => {
          const isActive = (tierFilter || 'all') === chip.value
          const params = withStatus(new URLSearchParams())
          if (chip.value !== 'all') params.set('tier', chip.value)
          return (
            <a
              key={chip.value}
              href={`?${params}`}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                isActive ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {chip.label}
            </a>
          )
        })}
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Tier</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Stripe</th>
              <th className="text-left px-4 py-3 font-medium">Period End</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3 text-white text-xs">{sub.user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 capitalize">
                    {sub.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      STATUS_COLORS[sub.status] || 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                  {sub.stripeSubscriptionId?.slice(0, 16) || '—'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {sub.currentPeriodEnd?.toLocaleDateString() || '—'}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{sub.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
