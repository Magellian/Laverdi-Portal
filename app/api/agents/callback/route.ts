import { NextRequest, NextResponse } from 'next/server'
import { markInstanceRunning } from '@/lib/provisioning/engine'

/**
 * POST /api/agents/callback — Called by containers once they're healthy.
 * Body: { instanceId: string, containerId?: string }
 * 
 * Protected by a shared secret (PROVISION_CALLBACK_SECRET).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.PROVISION_CALLBACK_SECRET || 'laverdi-callback-xK9m-2026'

  if (authHeader !== `Bearer ${expectedSecret}`) {
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
