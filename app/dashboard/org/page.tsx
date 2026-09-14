import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CreateOrgButton from '@/components/dashboard/CreateOrgButton'
import OrgNameEditor from '@/components/dashboard/OrgNameEditor'
import InviteMemberForm from '@/components/dashboard/InviteMemberForm'

export default async function OrgPage() {
  const session = await auth()
  const userId = session?.user?.id

  const org = userId
    ? await prisma.organization.findFirst({
        where: { ownerId: userId },
        include: {
          owner: { select: { email: true, name: true } },
          members: {
            include: { user: { select: { email: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          workspaces: { orderBy: { createdAt: 'asc' } },
        },
      })
    : null

  if (!org) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Organization</h1>
          <p className="mt-1 text-zinc-400">Manage your team, workspaces, and members</p>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 px-8 py-16 text-center">
          <span className="mb-4 text-6xl">🏢</span>
          <h2 className="mb-2 text-xl font-semibold text-white">No organization yet</h2>
          <p className="mb-6 max-w-sm text-sm text-zinc-400">
            Create an organization to invite teammates and manage workspaces together.
          </p>
          <CreateOrgButton />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <OrgNameEditor orgId={org.id} name={org.name} />
        <p className="mt-1 text-zinc-400">
          Owned by {org.owner.name || org.owner.email}
        </p>
      </div>

      {/* Members */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Members</h2>
        <ul className="space-y-3">
          <li className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">{org.owner.name || org.owner.email}</p>
              <p className="text-xs text-zinc-500">{org.owner.email}</p>
            </div>
            <span className="rounded-full border border-zinc-600 bg-zinc-700/50 px-2.5 py-1 text-xs font-medium text-zinc-300">
              owner
            </span>
          </li>
          {org.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-200">{member.user.name || member.user.email}</p>
                <p className="text-xs text-zinc-500">{member.user.email}</p>
              </div>
              <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 capitalize">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
        {org.members.length === 0 && (
          <p className="text-sm text-zinc-500">No additional members yet.</p>
        )}
      </div>

      {/* Workspaces */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Workspaces</h2>
        {org.workspaces.length === 0 ? (
          <p className="text-sm text-zinc-500">No workspaces yet.</p>
        ) : (
          <ul className="space-y-3">
            {org.workspaces.map((workspace) => (
              <li key={workspace.id} className="flex items-center justify-between">
                <p className="text-sm text-zinc-200">{workspace.name}</p>
                <p className="text-xs text-zinc-500">
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
        <h2 className="text-base font-semibold text-white mb-1">Invite Teammates</h2>
        <p className="text-sm text-zinc-400 mb-4">Invite a teammate by email to join this organization.</p>
        <InviteMemberForm />
      </div>
    </div>
  )
}
