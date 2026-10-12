import { prisma } from '@/lib/prisma'

/**
 * Credit wallet -- spends on image/video generation, independent of
 * subscription tier. See /topics/laverdi-saas media add-on scoping doc.
 *
 * Accounting model: `balance` on CreditBalance is always the
 * currently-spendable amount. holdCredits() decrements it immediately
 * (so a user can't double-spend across two jobs in flight); finalizeHold()
 * doesn't touch balance again (the hold already covered it); releaseHold()
 * refunds it back. Every movement is also written to CreditTransaction as
 * an append-only ledger for support/abuse review.
 */

export class InsufficientCreditsError extends Error {
  constructor(public needed: number, public available: number) {
    super(`Not enough credits: need ${needed}, have ${available}`)
    this.name = 'InsufficientCreditsError'
  }
}

export async function getOrCreateBalance(userId: string) {
  return prisma.creditBalance.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  })
}

export async function getBalance(userId: string): Promise<number> {
  const row = await prisma.creditBalance.findUnique({ where: { userId } })
  return row?.balance ?? 0
}

/**
 * Reserve `amount` credits for a media job. Throws InsufficientCreditsError
 * (caller should turn this into a 402-ish response) if the balance can't
 * cover it. Returns the CreditTransaction row for the hold.
 */
export async function holdCredits(userId: string, amount: number, mediaJobId: string, note?: string) {
  if (amount <= 0) throw new Error('holdCredits: amount must be positive')

  return prisma.$transaction(async (tx) => {
    const balanceRow = await tx.creditBalance.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    })

    if (balanceRow.balance < amount) {
      throw new InsufficientCreditsError(amount, balanceRow.balance)
    }

    await tx.creditBalance.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    })

    return tx.creditTransaction.create({
      data: {
        userId,
        creditBalanceId: balanceRow.id,
        amount: -amount,
        type: 'hold',
        mediaJobId,
        note,
      },
    })
  })
}

/** Mark a hold as consumed -- no balance change, the hold already paid for it. */
export async function finalizeCharge(userId: string, amount: number, mediaJobId: string) {
  const balanceRow = await getOrCreateBalance(userId)
  return prisma.creditTransaction.create({
    data: {
      userId,
      creditBalanceId: balanceRow.id,
      amount: 0,
      type: 'charge',
      mediaJobId,
      note: `Finalized ${amount} credit hold`,
    },
  })
}

/** Refund a hold -- the job failed, was denied, or the companion never claimed it in time. */
export async function releaseHold(userId: string, amount: number, mediaJobId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const balanceRow = await tx.creditBalance.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    })

    await tx.creditBalance.update({
      where: { userId },
      data: { balance: { increment: amount } },
    })

    return tx.creditTransaction.create({
      data: {
        userId,
        creditBalanceId: balanceRow.id,
        amount,
        type: 'refund',
        mediaJobId,
        note: note || 'Hold released',
      },
    })
  })
}

/** Credit a purchased pack -- called from the Stripe webhook. */
export async function purchaseCredits(userId: string, amount: number, stripePaymentIntentId: string) {
  return prisma.$transaction(async (tx) => {
    const balanceRow = await tx.creditBalance.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    })

    await tx.creditBalance.update({
      where: { userId },
      data: { balance: { increment: amount } },
    })

    return tx.creditTransaction.create({
      data: {
        userId,
        creditBalanceId: balanceRow.id,
        amount,
        type: 'purchase',
        stripePaymentIntentId,
      },
    })
  })
}

/**
 * Monthly plan credit grant (Pro/Enterprise rollover stipend). Idempotent
 * per calendar month via a tagged note -- safe to call repeatedly from a
 * cron hit without double-granting.
 */
export async function grantMonthlyCredits(userId: string, amount: number, tier: string) {
  const monthTag = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const note = `monthly-grant:${tier}:${monthTag}`

  const already = await prisma.creditTransaction.findFirst({
    where: { userId, type: 'grant', note },
  })
  if (already) return null

  return prisma.$transaction(async (tx) => {
    const balanceRow = await tx.creditBalance.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    })

    await tx.creditBalance.update({
      where: { userId },
      data: { balance: { increment: amount } },
    })

    return tx.creditTransaction.create({
      data: {
        userId,
        creditBalanceId: balanceRow.id,
        amount,
        type: 'grant',
        note,
      },
    })
  })
}

// Credit cost table -- see Pricing section of the scoping doc.
// 1 credit ~= $0.01 of provider cost, rounded up.
export const IMAGE_CREDIT_COST = 2 // flat, flux-class model
export const VIDEO_CREDITS_PER_SECOND = 5 // cheap-tier video model
export const MONTHLY_GRANT: Record<string, number> = {
  pro: 200,
  enterprise: 1000,
}

export function creditsForVideo(durationSeconds: number): number {
  const clamped = Math.max(1, Math.min(10, Math.round(durationSeconds)))
  return clamped * VIDEO_CREDITS_PER_SECOND
}
