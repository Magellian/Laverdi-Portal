import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are required')
}

/**
 * Browser Supabase client (for client components)
 * Uses PKCE flow with secure cookies and localStorage persistence
 * 
 * CRITICAL FIX: Added explicit localStorage persistence to ensure auth token
 * is saved during login and available for subsequent page loads.
 * Without this, sessions are lost on redirect.
 */
export function createBrowserClient() {
  if (typeof window === 'undefined') {
    // Server-side: return client that won't persist
    return createSupabaseBrowserClient(supabaseUrl!, supabasePublishableKey!)
  }
  
  // Client-side: initialize with localStorage persistence
  const supabase = createSupabaseBrowserClient(supabaseUrl!, supabasePublishableKey!)
  
  // Add explicit session listener to persist token to localStorage
  // This ensures the token survives page reloads and redirects
  if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Persist session to localStorage when user logs in
        try {
          localStorage.setItem('sb-auth-session', JSON.stringify(session))
          console.log('[Supabase] Session persisted to localStorage', {
            user: session.user?.email,
            hasToken: !!session.access_token
          })
        } catch (e) {
          console.error('[Supabase] Failed to persist session to localStorage:', e)
        }
      } else {
        // Clear localStorage when user logs out
        try {
          localStorage.removeItem('sb-auth-session')
          console.log('[Supabase] Session cleared from localStorage')
        } catch (e) {
          console.error('[Supabase] Failed to clear session from localStorage:', e)
        }
      }
    })
  }
  
  return supabase
}

/**
 * Server Supabase client (for server components, actions, and API routes)
 * Uses service role key for elevated permissions with explicit authentication
 * 
 * NOTE: This function requires async/await and should be called from async contexts only.
 * For use in API routes (pages/api), use createAdminClient() instead.
 */
export async function createServerClient() {
  // Dynamically import cookies only when needed (in App Router contexts)
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    supabaseUrl!,
    supabasePublishableKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Admin Supabase client (for server-side admin operations)
 * Uses service role key - should only be used in trusted server contexts (API routes, scripts)
 * 
 * This is the preferred client for pages/api/* routes and backend scripts.
 */
export function createAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  // Use the proper Supabase initialization for server-side with service role key
  return createClient(supabaseUrl!, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type { User, Session } from '@supabase/supabase-js'

// Database types
export interface UserProfile {
  id: string
  email: string
  tier: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise'
  api_key: string
  trial_expires_at: string | null
  monthly_call_limit: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  key: string
  name: string
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}

export interface UsageLog {
  id: string
  user_id: string
  endpoint: string
  method: string
  status_code: number
  call_count: number
  timestamp: string
}

export interface Instance {
  id: string
  user_id: string
  droplet_id: string | null
  ip_address: string | null
  status: 'provisioning' | 'ready' | 'failed'
  pairing_token: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  email_notifications: boolean
  marketing_emails: boolean
  weekly_summary: boolean
  instance_alerts: boolean
  usage_alerts: boolean
  created_at: string
  updated_at: string
}

export interface EmailVerification {
  id: string
  user_id: string
  new_email: string
  code: string
  created_at: string
  expires_at: string
}
