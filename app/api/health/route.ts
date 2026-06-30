import { prisma } from '@/lib/prisma'

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return 'ok'
  } catch (err) {
    console.error('Database check failed:', err)
    return 'error'
  }
}

function checkStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY
}

export async function GET() {
  const checks = {
    app: 'ok',
    database: await checkDatabase(),
    stripe: checkStripeConfigured(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }

  const allOk = checks.database === 'ok'
  return Response.json(checks, { status: allOk ? 200 : 503 })
}
