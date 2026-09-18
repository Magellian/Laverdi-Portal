import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getProvisionCallbackSecret } from '@/lib/provisioning/engine'

const VALID_KINDS = new Set(['install_package', 'run_command', 'render_job'])

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
 * POST /api/agents/[id]/companion/jobs — Called by the sandboxed Hermes
 * instance itself (via the host-side `hermes-delegate` helper, never from
 * inside the egress-locked-down sandbox) to hand off work the sandbox can't
 * or shouldn't do itself (a blocked package install, a heavier local
 * command, a render job) to the paired local companion app.
 *
 * Protected by the same shared secret as /api/agents/callback
 * (PROVISION_CALLBACK_SECRET) — this is server-to-server, not a user
 * session and not the per-instance pairing token.
 *
 * Body: { kind: 'install_package'|'run_command'|'render_job', payload?: object }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkServerAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const instance = await prisma.instance.findUnique({ where: { id } })
  if (!instance) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { kind, payload } = body as { kind?: string; payload?: unknown }

  if (!kind || !VALID_KINDS.has(kind)) {
    return NextResponse.json({ error: `kind must be one of ${[...VALID_KINDS].join(', ')}` }, { status: 400 })
  }

  if (instance.delegationPolicy === 'server_only') {
    return NextResponse.json(
      { error: 'Delegation is disabled for this instance (delegationPolicy=server_only)' },
      { status: 403 }
    )
  }

  // auto_trusted / auto_all: no human in the loop needed, the job is
  // immediately visible to the paired companion on its next heartbeat.
  // ask (the default): the job sits at 'pending' until a human approves it
  // from the dashboard (Step 5) — not yet built, so for now it will simply
  // wait there until approved or the caller's poll times out.
  const status = instance.delegationPolicy === 'ask' ? 'pending' : 'approved'

  const job = await prisma.delegatedJob.create({
    data: {
      instanceId: id,
      kind,
      status,
      payload: payload !== undefined ? JSON.stringify(payload) : null,
    },
  })

  return NextResponse.json({ id: job.id, status: job.status })
}
