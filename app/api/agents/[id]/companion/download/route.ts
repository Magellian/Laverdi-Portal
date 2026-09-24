import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePairingToken, buildCompanionInstaller } from '@/lib/provisioning/engine'

/**
 * GET /api/agents/[id]/companion/download — a personalized LaVerdi
 * Companion installer for this instance. The pairing token is baked in
 * server-side (issuing one first if this instance doesn't have one yet),
 * so the installer pairs and starts itself with no manual commands.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let instance = await prisma.instance.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  if (!instance.pairingToken) {
    instance = await prisma.instance.update({
      where: { id },
      data: { pairingToken: generatePairingToken() },
    })
  }

  try {
    const exe = await buildCompanionInstaller(instance.id, instance.pairingToken!)
    return new NextResponse(new Uint8Array(exe), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Disposition': 'attachment; filename="LaVerdiCompanion-Setup.exe"',
        'Content-Length': String(exe.length),
      },
    })
  } catch (err) {
    console.error('Failed to build personalized companion installer:', err)
    return NextResponse.json(
      { error: 'Could not build the installer right now. Please try again in a moment.' },
      { status: 502 }
    )
  }
}
