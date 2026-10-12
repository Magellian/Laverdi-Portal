import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getProvisionCallbackSecret } from '@/lib/provisioning/engine'
import { isDelegationKillSwitchActive } from '@/lib/kill-switch'
import { holdCredits, finalizeCharge, releaseHold, InsufficientCreditsError, IMAGE_CREDIT_COST, creditsForVideo } from '@/lib/credits'
import { generateImage, generateVideo, FalNotConfiguredError, FalRequestError } from '@/lib/media/fal'

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
 * or shouldn't do itself.
 *
 * Protected by the same shared secret as /api/agents/callback
 * (PROVISION_CALLBACK_SECRET) — this is server-to-server, not a user
 * session and not the per-instance pairing token.
 *
 * Body: { kind: 'install_package'|'run_command'|'render_job', payload?: object }
 *
 * render_job is media generation (image/video) -- see the media add-on
 * scoping doc. It's credit-gated rather than approval-gated for images
 * (nothing touches the user's machine, so delegationPolicy doesn't apply);
 * video goes through both credits AND the normal delegationPolicy gate,
 * since it does land a file on the user's computer via the companion app.
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

  if (kind === 'render_job') {
    return handleRenderJob(id, instance, payload)
  }

  // install_package / run_command -- unchanged local-execution delegation flow.
  if (await isDelegationKillSwitchActive()) {
    return NextResponse.json(
      { error: 'Delegation is globally disabled right now (operator kill switch is on)' },
      { status: 503 }
    )
  }

  if (instance.delegationPolicy === 'server_only') {
    return NextResponse.json(
      { error: 'Delegation is disabled for this instance (delegationPolicy=server_only)' },
      { status: 403 }
    )
  }

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

interface RenderPayload {
  mediaType?: 'image' | 'video'
  prompt?: string
  durationSeconds?: number
}

async function handleRenderJob(
  instanceId: string,
  instance: { ownerId: string; delegationPolicy: string; companionStatus: string },
  rawPayload: unknown
) {
  const payload = (rawPayload || {}) as RenderPayload
  const mediaType = payload.mediaType
  const prompt = (payload.prompt || '').trim()

  if (mediaType !== 'image' && mediaType !== 'video') {
    return NextResponse.json({ error: "render_job payload.mediaType must be 'image' or 'video'" }, { status: 400 })
  }
  if (!prompt) {
    return NextResponse.json({ error: 'render_job payload.prompt is required' }, { status: 400 })
  }

  const userId = instance.ownerId
  const durationSeconds = Math.max(1, Math.min(10, Math.round(payload.durationSeconds || 5)))
  const creditsNeeded = mediaType === 'image' ? IMAGE_CREDIT_COST : creditsForVideo(durationSeconds)

  // Video needs the companion app paired *before* we spend anything --
  // there's nowhere for the file to go otherwise.
  if (mediaType === 'video') {
    if (instance.companionStatus !== 'paired') {
      return NextResponse.json(
        {
          error:
            'Video generation requires the companion app to be installed and paired on this agent -- it saves the file to your own computer, not our servers.',
        },
        { status: 400 }
      )
    }
    if (await isDelegationKillSwitchActive()) {
      return NextResponse.json(
        { error: 'Delegation is globally disabled right now (operator kill switch is on)' },
        { status: 503 }
      )
    }
    if (instance.delegationPolicy === 'server_only') {
      return NextResponse.json(
        { error: 'Video generation is disabled for this instance (delegationPolicy=server_only)' },
        { status: 403 }
      )
    }
  }

  const mediaJob = await prisma.mediaJob.create({
    data: {
      instanceId,
      userId,
      mediaKind: mediaType,
      provider: 'fal',
      model: mediaType === 'image' ? 'flux' : 'minimax-hailuo',
      prompt,
      durationSeconds: mediaType === 'video' ? durationSeconds : null,
      creditsHeld: creditsNeeded,
      status: 'pending',
    },
  })

  try {
    await holdCredits(userId, creditsNeeded, mediaJob.id, `render_job:${mediaType}`)
  } catch (err) {
    await prisma.mediaJob.update({ where: { id: mediaJob.id }, data: { status: 'failed', resultSummary: 'Insufficient credits' } })
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `Not enough credits for this ${mediaType} (needs ${err.needed}, you have ${err.available}). Buy more credits from Workspace → Your Plan.` },
        { status: 402 }
      )
    }
    throw err
  }

  if (mediaType === 'image') {
    try {
      const { url } = await generateImage(prompt)
      await finalizeCharge(userId, creditsNeeded, mediaJob.id)
      const delegatedJob = await prisma.delegatedJob.create({
        data: {
          instanceId,
          kind: 'render_job',
          status: 'completed',
          payload: JSON.stringify({ mediaType, prompt }),
          resultSummary: `Generated image: ${url}`,
        },
      })
      await prisma.mediaJob.update({
        where: { id: mediaJob.id },
        data: {
          status: 'delivered',
          creditsCharged: creditsNeeded,
          providerResultUrl: url,
          delegatedJobId: delegatedJob.id,
          resultSummary: `Generated image: ${url}`,
        },
      })
      return NextResponse.json({ id: delegatedJob.id, status: delegatedJob.status })
    } catch (err) {
      const message = err instanceof FalNotConfiguredError || err instanceof FalRequestError ? err.message : 'Image generation failed'
      await releaseHold(userId, creditsNeeded, mediaJob.id, message)
      const delegatedJob = await prisma.delegatedJob.create({
        data: {
          instanceId,
          kind: 'render_job',
          status: 'failed',
          payload: JSON.stringify({ mediaType, prompt }),
          resultSummary: message,
        },
      })
      await prisma.mediaJob.update({
        where: { id: mediaJob.id },
        data: { status: 'failed', delegatedJobId: delegatedJob.id, resultSummary: message },
      })
      return NextResponse.json({ id: delegatedJob.id, status: delegatedJob.status })
    }
  }

  // Video: ask policy needs a human to approve before we spend money
  // calling the provider -- see the approve route, which does that call.
  const needsApproval = instance.delegationPolicy === 'ask'
  const delegatedJob = await prisma.delegatedJob.create({
    data: {
      instanceId,
      kind: 'render_job',
      status: needsApproval ? 'pending' : 'approved',
      payload: JSON.stringify({ mediaType, prompt, durationSeconds, mediaJobId: mediaJob.id }),
    },
  })
  await prisma.mediaJob.update({ where: { id: mediaJob.id }, data: { delegatedJobId: delegatedJob.id } })

  if (needsApproval) {
    return NextResponse.json({ id: delegatedJob.id, status: delegatedJob.status })
  }

  const outcome = await startVideoGeneration(mediaJob.id, delegatedJob.id, prompt, durationSeconds)
  return NextResponse.json({ id: delegatedJob.id, status: outcome.status })
}

/**
 * Calls the provider for a video render_job that's been approved (either
 * automatically, by delegationPolicy, or by a human via the approve
 * route), and stashes the provider's transient download URL on both rows
 * so it rides along in the companion app's next heartbeat. Exported for
 * the approve route to reuse.
 */
export async function startVideoGeneration(
  mediaJobId: string,
  delegatedJobId: string,
  prompt: string,
  durationSeconds: number
) {
  const mediaJob = await prisma.mediaJob.findUnique({ where: { id: mediaJobId } })
  if (!mediaJob) return { status: 'failed' as const }

  try {
    const { url, expiresAt } = await generateVideo(prompt, durationSeconds)
    await prisma.delegatedJob.update({
      where: { id: delegatedJobId },
      data: {
        payload: JSON.stringify({ mediaType: 'video', downloadUrl: url, expiresAt: expiresAt.toISOString(), mediaJobId }),
      },
    })
    await prisma.mediaJob.update({
      where: { id: mediaJobId },
      data: { status: 'awaiting_companion', providerResultUrl: url, providerResultExpiresAt: expiresAt },
    })
    return { status: 'approved' as const }
  } catch (err) {
    const message = err instanceof FalNotConfiguredError || err instanceof FalRequestError ? err.message : 'Video generation failed'
    await releaseHold(mediaJob.userId, mediaJob.creditsHeld, mediaJobId, message)
    await prisma.delegatedJob.update({ where: { id: delegatedJobId }, data: { status: 'failed', resultSummary: message } })
    await prisma.mediaJob.update({ where: { id: mediaJobId }, data: { status: 'failed', resultSummary: message } })
    return { status: 'failed' as const }
  }
}
