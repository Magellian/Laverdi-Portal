import { createAdminClient } from '@/lib/supabase'

// Monthly call limits per tier
const TIER_LIMITS: Record<string, number> = {
  free: 100,
  trial: 500,
  starter: 5000,
  professional: 20000,
  enterprise: Infinity,
}

/**
 * Check whether a user is under their monthly call limit.
 * If under the limit, logs the call to usage_logs and returns true.
 * Returns false if the limit is exceeded (call is not logged).
 *
 * Fails open: returns true on infrastructure errors so users aren't
 * accidentally blocked by a transient DB issue.
 */
export async function checkRateLimit(userId: string, tier: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient()

    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free
    if (limit === Infinity) return true

    const startOfMonth = getStartOfMonth()

    const { count, error: countError } = await supabaseAdmin
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', startOfMonth)

    if (countError) {
      console.error('[rate-limit] Failed to fetch usage count:', countError)
      return true // fail open
    }

    const currentCount = count ?? 0
    if (currentCount >= limit) {
      return false
    }

    // Log this call
    const { error: insertError } = await supabaseAdmin.from('usage_logs').insert({
      user_id: userId,
      endpoint: 'api',
      method: 'POST',
      status_code: 200,
      call_count: 1,
      timestamp: new Date().toISOString(),
    })

    if (insertError) {
      console.error('[rate-limit] Failed to log usage:', insertError)
      // Still allow the call even if logging failed
    }

    return true
  } catch (err) {
    console.error('[rate-limit] Error initializing admin client:', err)
    return true // fail open
  }
}

/**
 * Returns how many calls the user has remaining this month.
 * Reads the user's tier and monthly_call_limit directly from the DB.
 */
export async function getRemainingCalls(userId: string): Promise<number> {
  try {
    const supabaseAdmin = createAdminClient()

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('tier, monthly_call_limit')
      .eq('id', userId)
      .single()

    if (userError || !userRow) {
      console.error('[rate-limit] Failed to fetch user for remaining calls:', userError)
      return 0
    }

    const tier: string = userRow.tier ?? 'free'
    const limit: number = userRow.monthly_call_limit ?? TIER_LIMITS[tier] ?? TIER_LIMITS.free

    if (limit === Infinity) return Infinity

    const startOfMonth = getStartOfMonth()

    const { count, error: countError } = await supabaseAdmin
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', startOfMonth)

    if (countError) {
      console.error('[rate-limit] Failed to fetch usage count for remaining calls:', countError)
      return 0
    }

    return Math.max(0, limit - (count ?? 0))
  } catch (err) {
    console.error('[rate-limit] Error initializing admin client:', err)
    return 0
  }
}

function getStartOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
