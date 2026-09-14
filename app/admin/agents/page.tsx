import { prisma } from '@/lib/prisma'

const STATUS_CHIPS = [
  { value: 'all', label: 'All', active: 'bg-white text-black' },
  { value: 'running', label: 'Running', active: 'bg-green-600 text-white' },
  { value: 'provisioning', label: 'Provisioning', active: 'bg-yellow-600 text-white' },
  { value: 'error', label: 'Error', active: 'bg-red-600 text-white' },
  { value: 'stopped', label: 'Stopped', active: 'bg-zinc-600 text-white' },
]

const TIER_CHIPS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-green-900/50 text-green-400',
  error: 'bg-red-900/50 text-red-400',
  stopped: 'bg-zinc-700 text-zinc-400',
  provisioning: 'bg-yellow-900/50 text-yellow-400',
}

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tier?: string }>
}) {
  const { status: statusFilter, tier: tierFilter } = await searchParams

  const where: { status?: string; tier?: string } = {}
  if (statusFilter && statusFilter !== 'all') where.status = statusFilter
  if (tierFilter && tierFilter !== 'all') where.tier = tierFilter

  const agents = await prisma.instance.findMany({
    include: { owner: { select: { email: true } } },
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
      <h1 className="text-2xl font-bold text-white mb-6">All Agents</h1>

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
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Tier</th>
              <th className="text-left px-4 py-3 font-medium">Model</th>
              <th className="text-left px-4 py-3 font-medium">Port</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {agents.map((inst) => (
              <tr key={inst.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3 text-white">{inst.name || inst.id.slice(0, 12)}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{inst.owner.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      STATUS_COLORS[inst.status] || 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {inst.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{inst.tier || '—'}</td>
                <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{inst.modelPrimary || '—'}</td>
                <td className="px-4 py-3 text-zinc-400">{inst.port || '—'}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{inst.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
