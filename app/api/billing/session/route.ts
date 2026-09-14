import { NextRequest, NextResponse } from 'next/server'
import { stripe, getTierFromPriceId } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    const subscription = session.subscription as any
    const priceId = subscription?.items?.data?.[0]?.price?.id || ''

    return NextResponse.json({
      customerEmail: session.customer_email || session.customer_details?.email || null,
      tier: priceId ? getTierFromPriceId(priceId) : null,
      status: subscription?.status || session.payment_status,
    })
  } catch (err) {
    console.error('Error fetching checkout session:', err)
    return NextResponse.json({
      customerEmail: null,
      tier: null,
      status: 'unknown',
    })
  }
}
