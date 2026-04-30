import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { loadStripe } from '@stripe/stripe-js'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

export default function Checkout() {
  const router = useRouter()
  const { plan } = router.query
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planId, setPlanId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        setCheckingAuth(true)
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('[Checkout] Session check:', {
          hasSession: !!session,
          user: session?.user?.email,
          plan
        })
        
        if (!session?.user) {
          // Not logged in - redirect to signup
          router.push(`/auth/signup?plan=${plan}`)
          return
        }
        
        setUser(session.user)
        const mappedPlan = typeof plan === 'string' ? plan : 'starter'
        setPlanId(mappedPlan)
      } catch (err) {
        console.error('[Checkout] Auth check failed:', err)
        router.push(`/auth/signup?plan=${plan}`)
      } finally {
        setCheckingAuth(false)
      }
    }

    if (router.isReady && plan) {
      checkAuth()
    }
  }, [plan, router.isReady])

  async function handleCheckout() {
    setError('')
    setLoading(true)

    try {
      // CRITICAL: Refresh session before checkout to ensure token is fresh
      // This prevents session loss during/after Stripe redirect
      await supabase.auth.refreshSession()
      
      // Get the session to extract the auth token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      console.log('[Checkout] handleCheckout called', {
        hasToken: !!token,
        planId,
        userEmail: session?.user?.email
      })

      if (!token) {
        throw new Error('No active session - please log in again')
      }

      if (!planId) {
        throw new Error('No plan selected')
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      })

      console.log('[Checkout] API response:', { status: response.status })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `HTTP ${response.status}` }
        }
        throw new Error(errorData.error || 'Checkout failed')
      }

      const data = await response.json()
      console.log('[Checkout] Success, redirecting to:', data.url ? 'Stripe' : 'nowhere')
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      console.error('[Checkout] Error:', err)
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Checking authentication...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Not authenticated. Redirecting...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Checkout - Laverdi.tech</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2">
            Upgrade to {planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : 'Premium'}
          </h1>
          <p className="text-center text-gray-600 mb-8">Complete your purchase to get started</p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>

          <p className="text-center text-gray-600 text-sm mt-6">
            You will be redirected to Stripe to complete your payment securely.
          </p>
        </div>
      </div>
    </>
  )
}
