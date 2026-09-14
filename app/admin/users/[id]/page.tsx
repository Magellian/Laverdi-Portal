import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const SUB_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  past_due: 'bg-yellow-900/50 text-yellow-400',
  canceled: 'bg-red-900/50 text-red-400',
  unpaid: 'bg-red-900/50 text-red-400',
  incomplete: 'bg-zinc-800 text-zinc-400',
}

const INSTANCE_STATUS_COLORS: Record<string, string> = {
  running: 'bg-green-900/50 text-green-400',
  error: 'bg-red-900/50 text-red-400',
  provisioning: 'bg-yellow-900/50 text-yellow-400',
  stopped: 'bg-zinc-800 text-zinc-400',
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      instances: { orderBy: { createdAt: 'desc' } },
      subscriptions: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!user) notFound()

  return (
    <div className="p-8">
      <Link href="/admin/users" className="text-sm text-zinc-500 hover:text-white transition-colors">
        ← Back to Users
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white mb-2">{user.email}</h1>
      <p className="text-zinc-500 mb-8">
        Joined {user.createdAt.toLocaleDateString()}
        {user.name && ` · ${user.name}`}
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Subscriptions</h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Tier</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Stripe ID</th>
                <th className="text-left px-4 py-3 font-medium">Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {user.subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
                      {sub.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        SUB_STATUS_COLORS[sub.status] || 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                    {sub.stripeSubscriptionId || '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {sub.currentPeriodEnd?.toLocaleDateString() || '—'}
                  </td>
                </tr>
              ))}
              {user.subscriptions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No subscriptions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Agents ({user.instances.length})</h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Tier</th>
                <th className="text-left px-4 py-3 font-medium">Model</th>
                <th className="text-left px-4 py-3 font-medium">Port</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {user.instances.map((inst) => (
                <tr key={inst.id}>
                  <td className="px-4 py-3 text-white">{inst.name || inst.id.slice(0, 12)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        INSTANCE_STATUS_COLORS[inst.status] || 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{inst.tier || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{inst.modelPrimary || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{inst.port || '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{inst.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {user.instances.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No agents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
