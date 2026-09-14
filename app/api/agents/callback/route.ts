import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { markInstanceRunning, getProvisionCallbackSecret } from '@/lib/provisioning/engine'

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf)
    return false
  }
  return crypto.timingSafeEqual(aBuf, bBuf)
}

/**
 * POST /api/agents/callback — Called by containers once they're healthy.
 * Body: { instanceId: string, containerId?: string }
 *
 * Protected by a shared secret (PROVISION_CALLBACK_SECRET).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''

  let expectedSecret: string
  try {
    expectedSecret = getProvisionCallbackSecret()
  } catch (err) {
    console.error('Callback misconfigured:', err)
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (!safeEqual(authHeader, `Bearer ${expectedSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { instanceId, containerId } = await request.json()

    if (!instanceId) {
      return NextResponse.json({ error: 'instanceId required' }, { status: 400 })
    }

    await markInstanceRunning(instanceId, containerId)

    return NextResponse.json({ status: 'ok', instanceId })
  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
