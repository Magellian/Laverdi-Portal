import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getProvisionCallbackSecret } from '@/lib/provisioning/engine'
import { grantMonthlyCredits, MONTHLY_GRANT } from '@/lib/credits'

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf)
    return false
  }
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function checkServerAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') || ''
  let expectedSecret: string
  try {
    expectedSecret = getProvisionCallbackSecret()
  } catch {
    return false
  }
  return safeEqual(authHeader, `Bearer ${expectedSecret}`)
}

/**
 * POST /api/admin/cron/grant-credits -- monthly rollover credit stipend
 * for Pro/Enterprise subscribers (Starter gets a one-time trial grant at
 * signup instead, handled separately). Idempotent per calendar month per
 * user (see grantMonthlyCredits), so this is safe to hit daily from cron
 * rather than needing to land exactly on the 1st -- see crontab -l on the
 * VPS. Protected by the same shared secret as the provisioning callback.
 */
export async function POST(request: NextRequest) {
  if (!checkServerAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subs = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'trialing'] },
      tier: { in: Object.keys(MONTHLY_GRANT) },
    },
    select: { userId: true, tier: true },
  })

  // One grant per user even if they somehow have more than one active sub row.
  const seen = new Set<string>()
  let granted = 0
  let skipped = 0

  for (const sub of subs) {
    if (seen.has(sub.userId)) continue
    seen.add(sub.userId)

    const amount = MONTHLY_GRANT[sub.tier]
    if (!amount) continue

    const result = await grantMonthlyCredits(sub.userId, amount, sub.tier)
    if (result) granted++
    else skipped++
  }

  return NextResponse.json({ status: 'ok', usersChecked: seen.size, granted, alreadyGrantedThisMonth: skipped })
}
