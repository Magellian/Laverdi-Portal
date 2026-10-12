import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getProvisionCallbackSecret } from '@/lib/provisioning/engine'
import { releaseHold } from '@/lib/credits'

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
 * POST /api/admin/cron/expire-media-jobs -- sweeps video MediaJob rows
 * stuck at 'awaiting_companion' past the provider's own link expiry (the
 * companion app was never online to claim them in time). Releases the
 * credit hold -- nobody pays for a video that never reached their
 * machine -- and marks the job + its DelegatedJob row 'expired'/'failed'.
 * See Credit model + Open questions (pickup window) in the scoping doc.
 */
export async function POST(request: NextRequest) {
  if (!checkServerAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stuck = await prisma.mediaJob.findMany({
    where: {
      mediaKind: 'video',
      status: 'awaiting_companion',
      providerResultExpiresAt: { lt: new Date() },
    },
  })

  for (const job of stuck) {
    await releaseHold(job.userId, job.creditsHeld, job.id, 'Companion app did not claim this video before the link expired')
    await prisma.mediaJob.update({
      where: { id: job.id },
      data: { status: 'expired', resultSummary: 'Link expired before the companion app claimed it -- credits refunded.' },
    })
    if (job.delegatedJobId) {
      await prisma.delegatedJob.update({
        where: { id: job.delegatedJobId },
        data: { status: 'failed', resultSummary: 'Link expired before the companion app claimed it -- credits refunded.' },
      })
    }
  }

  return NextResponse.json({ status: 'ok', expired: stuck.length })
}
