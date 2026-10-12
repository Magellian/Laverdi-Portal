import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const agentCount = session.user?.id
    ? await prisma.instance.count({
        where: { ownerId: session.user.id, status: { in: ['provisioning', 'running'] } },
      })
    : 0

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar email={session.user?.email} agentCount={agentCount} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
