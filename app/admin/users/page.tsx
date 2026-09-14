import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const query = q || ''
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const where = query
    ? { email: { contains: query, mode: 'insensitive' as const } }
    : undefined

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { instances: true } },
        subscriptions: {
          where: { status: 'active' },
          select: { tier: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by email..."
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200"
          >
            Search
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Tier</th>
              <th className="text-left px-4 py-3 font-medium">Agents</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-white hover:underline">
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">{user.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
                    {user.subscriptions[0]?.tier || 'none'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{user._count.instances}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {user.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
        <p>
          Page {page} of {totalPages} · {total} user{total === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2">
          <Link
            href={`?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(Math.max(1, page - 1)) })}`}
            className={`px-3 py-1.5 rounded-lg border border-zinc-800 ${
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-900 text-white'
            }`}
          >
            Previous
          </Link>
          <Link
            href={`?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(Math.min(totalPages, page + 1)) })}`}
            className={`px-3 py-1.5 rounded-lg border border-zinc-800 ${
              page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-900 text-white'
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  )
}
