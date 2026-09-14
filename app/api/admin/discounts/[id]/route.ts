import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * PATCH /api/admin/discounts/[id] — Toggle isActive or update fields.
 * Body: { isActive?, description?, discountType?, discountValue?, maxUses?, expiresAt? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const existing = await prisma.discountCode.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 })
  }

  const data: Record<string, any> = {}
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body.description === 'string') data.description = body.description
  if (body.discountType === 'free' || body.discountType === 'percentage') {
    data.discountType = body.discountType
  }
  if (body.discountValue !== undefined) {
    data.discountValue =
      body.discountValue === null ? null : Number(body.discountValue)
  }
  if (body.maxUses !== undefined) {
    data.maxUses =
      body.maxUses === null || body.maxUses === '' ? null : Number(body.maxUses)
  }
  if (body.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await prisma.discountCode.update({ where: { id }, data })
  return NextResponse.json({ code: updated })
}

/**
 * DELETE /api/admin/discounts/[id] — Remove a discount code.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  const existing = await prisma.discountCode.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 })
  }

  await prisma.discountCode.delete({ where: { id } })
  return NextResponse.json({ message: 'Code deleted' })
}
