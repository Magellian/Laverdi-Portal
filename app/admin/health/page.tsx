import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { COOKIE_NAME } from '@/lib/admin-auth'

interface HealthData {
  disk: string
  docker: string
  ssl: string
}

async function getHealthData(): Promise<{ data: HealthData | null; error: string | null }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    const res = await fetch('http://localhost:3000/api/admin/health', {
      headers: token ? { Cookie: `${COOKIE_NAME}=${token}` } : {},
      cache: 'no-store',
    })

    if (!res.ok) {
      return { data: null, error: `Health API returned ${res.status}` }
    }

    return { data: await res.json(), error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to reach health API' }
  }
}

export default async function AdminHealthPage() {
  const [{ data: health, error }, userCount, agentCount, activeSubCount] = await Promise.all([
    getHealthData(),
    prisma.user.count(),
    prisma.instance.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
  ])

  const dbStats = [
    { label: 'Users', value: String(userCount) },
    { label: 'Agents', value: String(agentCount) },
    { label: 'Active Subscriptions', value: String(activeSubCount) },
  ]

  const systemInfo = [
    { label: 'Disk Usage', value: health?.disk ?? 'unavailable' },
    { label: 'SSL Expires', value: health?.ssl ?? 'unavailable' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">System Health</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {dbStats.map((s) => (
          <div key={s.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <p className="text-sm text-zinc-400">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-800 p-4 mb-4">
          <p className="text-red-400 text-sm">Health API error: {error}</p>
        </div>
      )}

      <div className="space-y-4">
        {systemInfo.map((item) => (
          <div key={item.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-sm text-zinc-400">{item.label}</p>
            <p className="mt-1 text-white font-mono text-sm">{item.value}</p>
          </div>
        ))}

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400 mb-2">Docker Containers</p>
          <pre className="text-white font-mono text-xs whitespace-pre-wrap">
            {health?.docker ?? 'unavailable'}
          </pre>
        </div>
      </div>
    </div>
  )
}
