// Alias — Stripe endpoint is configured to /api/stripe/webhook
// Actual handler lives at /api/billing/webhook
export { POST } from '@/app/api/billing/webhook/route'