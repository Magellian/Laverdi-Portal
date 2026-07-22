import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * Generate a random discount code like "LAVERDI-A1B2C".
 * Avoids Math.random()-free environments by deriving from crypto.
 */
function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(5)
  globalThis.crypto.getRandomValues(bytes)
  let suffix = ''
  for (const b of bytes) suffix += alphabet[b % alphabet.length]
  return `LAVERDI-${suffix}`
}

/**
 * GET /api/admin/discounts — List all discount codes, newest first.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ codes })
}

/**
 * POST /api/admin/discounts — Create a discount code.
 * Body: { code?, description?, discountType, discountValue?, maxUses?, expiresAt? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json().catch(() => ({}))

  const discountType = body.discountType === 'free' ? 'free' : 'percentage'

  if (discountType === 'percentage') {
    const v = Number(body.discountValue)
    if (!Number.isFinite(v) || v <= 0 || v > 100) {
      return NextResponse.json(
        { error: 'Percentage discounts require a discountValue between 1 and 100' },
        { status: 400 }
      )
    }
  }

  const code = (typeof body.code === 'string' && body.code.trim())
    ? body.code.trim().toUpperCase()
    : generateCode()

  // Ensure uniqueness
  const existing = await prisma.discountCode.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json({ error: 'Code already exists' }, { status: 409 })
  }

  const created = await prisma.discountCode.create({
    data: {
      code,
      description: body.description || null,
      discountType,
      discountValue: discountType === 'percentage' ? Number(body.discountValue) : null,
      maxUses:
        body.maxUses === null || body.maxUses === undefined || body.maxUses === ''
          ? null
          : Number(body.maxUses),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      createdBy: guard.user!.id!,
    },
  })

  return NextResponse.json({ code: created }, { status: 201 })
}
