import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { getSystemSettings, setDelegationKillSwitch } from '@/lib/kill-switch'

/**
 * GET/PATCH /api/admin/kill-switch — the Step 7 narrow-beta safety net.
 * Flipping this on instantly blocks all new delegated-job creation and
 * hides already-approved jobs from every companion heartbeat, across
 * every instance, with no redeploy (see lib/kill-switch.ts).
 *
 * Guarded the same way the rest of the /admin/* operator panel is: the
 * single-operator ADMIN_PASSWORD cookie from lib/admin-auth.ts, not the
 * per-user NextAuth session used by customer-facing routes.
 */
async function requireAdminCookie(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? verifyAdminToken(token) : false
}

export async function GET() {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = await getSystemSettings()
  return NextResponse.json({
    delegationKillSwitch: settings.delegationKillSwitch,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { delegationKillSwitch } = body as { delegationKillSwitch?: boolean }
  if (typeof delegationKillSwitch !== 'boolean') {
    return NextResponse.json({ error: 'delegationKillSwitch must be a boolean' }, { status: 400 })
  }

  const settings = await setDelegationKillSwitch(delegationKillSwitch, 'admin-panel')
  return NextResponse.json({
    delegationKillSwitch: settings.delegationKillSwitch,
    updatedAt: settings.updatedAt,
  })
}
