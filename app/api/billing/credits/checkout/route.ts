import { NextRequest, NextResponse } from 'next/server'
import { stripe, getCreditPack } from '@/lib/stripe'
import { auth } from '@/lib/auth'

/**
 * POST /api/billing/credits/checkout -- one-time Stripe Checkout session
 * for a credit pack (mode: 'payment', not a subscription). Requires a
 * signed-in user since credits are tied to a specific account.
 *
 * Body: { packId: 'starter' | 'creator' | 'pro' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Sign in required to buy credits' }, { status: 401 })
    }

    const { packId } = await request.json()
    const pack = getCreditPack(packId)
    if (!pack) {
      return NextResponse.json({ error: 'Unknown credit pack' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pack.priceId, quantity: 1 }],
      customer_email: session.user.email,
      success_url: `${process.env.NEXTAUTH_URL || 'https://laverdi.tech'}/dashboard/workspace?tab=plan&credits=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'https://laverdi.tech'}/dashboard/workspace?tab=plan`,
      billing_address_collection: 'auto',
      metadata: {
        type: 'credit_pack',
        userId: session.user.id,
        credits: String(pack.credits),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Credit checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
