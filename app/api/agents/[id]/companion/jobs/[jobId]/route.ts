import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getProvisionCallbackSecret } from '@/lib/provisioning/engine'

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
 * GET /api/agents/[id]/companion/jobs/[jobId] — Polled by the host-side
 * `hermes-delegate` helper (running alongside the sandboxed Hermes
 * instance) to learn whether the paired companion app has picked up and
 * finished a delegated job yet. Same server-to-server auth as job creation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  if (!checkServerAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, jobId } = await params
  const job = await prisma.delegatedJob.findFirst({ where: { id: jobId, instanceId: id } })
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: job.id,
    kind: job.kind,
    status: job.status,
    resultSummary: job.resultSummary,
  })
}
