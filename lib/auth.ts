import { createBrowserClient, createServerClient } from './supabase'

/**
 * Browser-side auth functions (client components)
 * Uses PKCE flow automatically via @supabase/ssr
 */
export async function signUp(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[Auth] Sign-in failed:', error)
    throw error
  }

  // Debug: log successful login and token state
  console.log('[Auth] Sign-in successful', {
    email,
    userId: data.user?.id,
    hasAccessToken: !!data.session?.access_token,
    sessionUser: data.session?.user?.email
  })
  
  // Verify token was persisted to localStorage
  if (typeof window !== 'undefined') {
    const storedSession = localStorage.getItem('sb-auth-session')
    console.log('[Auth] Session in localStorage:', !!storedSession ? 'YES' : 'NO')
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession)
        console.log('[Auth] Stored session user:', parsed.user?.email)
      } catch (e) {
        console.error('[Auth] Failed to parse stored session:', e)
      }
    }
  }

  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function resetPassword(email: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  if (error) {
    throw error
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }
}

/**
 * Get current user (browser-side)
 * Only works in client components after authentication
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Get session (browser-side)
 * Returns current session if available
 */
export async function getSession() {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Debug: log session retrieval
  if (typeof window !== 'undefined') {
    console.log('[Auth] getSession() called', {
      hasSession: !!session,
      user: session?.user?.email,
      hasToken: !!session?.access_token
    })
  }
  
  return session
}

/**
 * Server-side session retrieval
 * Use this in server components or API routes
 */
export async function getServerSession() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Server-side user retrieval
 * Use this in server components or API routes
 */
export async function getServerUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
