export const PRICING_PLANS = {
  starter: {
    id: 'price_1TOP3SBTYRav1HpsXRTdQpB3',
    name: 'Starter',
    price: 29.99,
    interval: 'month',
    features: [
      'Up to 1,000 API requests/month',
      'Basic support',
      'Single API key',
      'Email support',
    ],
  },
  professional: {
    id: 'price_1TOOPxBTYRav1HpsXTTywQHc',
    name: 'Professional',
    price: 99.99,
    interval: 'month',
    features: [
      'Up to 50,000 API requests/month',
      'Priority support',
      'Multiple API keys',
      'Advanced analytics',
      'Dedicated support channel',
    ],
  },
  enterprise: {
    id: 'price_enterprise',
    name: 'Enterprise',
    price: null,
    interval: 'custom',
    features: [
      'Unlimited API requests',
      '24/7 dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'On-premise option',
    ],
  },
}
