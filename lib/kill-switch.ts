import { prisma } from '@/lib/prisma'

// Single-row operator switch. Fixed id so there's never ambiguity about
// which row is "the" setting.
const GLOBAL_ID = 'global'

/**
 * Fast-path check used on every delegated-job creation and every companion
 * heartbeat. Cheap (indexed PK lookup) and fails safe: if the row is
 * missing for any reason, delegation behaves as if the switch is OFF
 * (matches the pre-migration behavior) rather than mysteriously blocking
 * everything.
 */
export async function isDelegationKillSwitchActive(): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({ where: { id: GLOBAL_ID } })
  return setting?.delegationKillSwitch ?? false
}

/** Full row, for the admin UI. Upserts so a missing row never 404s the page. */
export async function getSystemSettings() {
  return prisma.systemSetting.upsert({
    where: { id: GLOBAL_ID },
    update: {},
    create: { id: GLOBAL_ID },
  })
}

export async function setDelegationKillSwitch(active: boolean, updatedBy: string) {
  return prisma.systemSetting.upsert({
    where: { id: GLOBAL_ID },
    update: { delegationKillSwitch: active, updatedBy },
    create: { id: GLOBAL_ID, delegationKillSwitch: active, updatedBy },
  })
}
