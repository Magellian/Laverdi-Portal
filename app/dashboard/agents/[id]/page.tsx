import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import AgentDetailClient from '@/components/dashboard/AgentDetailClient'

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id } = await params

  const instance = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      port: true,
      tier: true,
      modelPrimary: true,
      modelFallback: true,
      apiKey: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!instance) {
    notFound()
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/dashboard/agents" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Back to Agents
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Agent Settings</h1>
      </div>

      <AgentDetailClient
        agent={{
          ...instance,
          createdAt: instance.createdAt.toISOString(),
          updatedAt: instance.updatedAt.toISOString(),
        }}
      />
    </div>
  )
}
