import Stripe from 'stripe'

// Lazy-init Stripe so the SDK isn't constructed at module load / build time
// (it throws when STRIPE_SECRET_KEY is absent). Mirrors the lazy Resend init
// in lib/auth.ts. The exported proxy keeps existing `stripe.*` call sites working.
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Map Stripe price IDs to tier names
const PRICE_TO_TIER: Record<string, string> = {
  'price_1Te3vfPgT412N4djnUuiI9Ea': 'starter',
  'price_1Te3wfPgT412N4djrFK1LT8V': 'pro',
  'price_1Te3xSPgT412N4djdvZotTBw': 'enterprise',
}

export function getTierFromPriceId(priceId: string): string {
  return PRICE_TO_TIER[priceId] || 'starter'
}

export function getTierLimits(tier: string) {
  switch (tier) {
    case 'enterprise':
      return { maxAgents: 20, maxChannels: -1, name: 'Enterprise', price: 199 }
    case 'pro':
      return { maxAgents: 5, maxChannels: 10, name: 'Pro', price: 49 }
    case 'starter':
    default:
      return { maxAgents: 1, maxChannels: 1, name: 'Starter', price: 19 }
  }
}
