import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { createBrowserClient } from '@/lib/supabase'
import type { GetServerSideProps } from 'next'

// This page must be publicly accessible (no auth required)
// It will validate the payment via Stripe API, not via session
export const getServerSideProps: GetServerSideProps = async (context) => {
  // Simply return props - no auth check
  // The client will handle payment confirmation
  return {
    props: {},
  }
}

export default function CheckoutSuccess() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function processPayment() {
      try {
        const sessionId = router.query.session_id as string
        console.log('[CheckoutSuccess] Processing payment, sessionId:', sessionId)
        console.log('[CheckoutSuccess] Router ready:', router.isReady)
        console.log('[CheckoutSuccess] Full query:', router.query)
        
        if (!sessionId) {
          setStatus('error')
          setMessage('No session ID found. Payment may not have completed.')
          return
        }

        // Get email from Stripe session directly (don't need user session)
        console.log('[CheckoutSuccess] Fetching Stripe session to get email')
        
        // Call backend endpoint that will:
        // 1. Get the Stripe session (public info)
        // 2. Extract customer email from Stripe
        // 3. Update user tier
        // 4. Provision container
        const response = await fetch(
          `/api/checkout/confirm-upgrade?sessionId=${encodeURIComponent(sessionId)}`,
          { method: 'GET' }
        )

        const result = await response.json()
        console.log('[CheckoutSuccess] Response:', result)

        if (response.ok) {
          // Redirect to magic link (auto-login) or fallback to payment-login
          if (result.redirectUrl) {
            // Magic links are absolute URLs (supabase.co domain)
            // Local paths start with /
            if (result.redirectUrl.startsWith('http')) {
              window.location.href = result.redirectUrl
            } else {
              router.push(result.redirectUrl)
            }
          } else {
            router.push('/dashboard?upgraded=true')
          }
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to process payment')
        }
      } catch (err: any) {
        console.error('[CheckoutSuccess] Error:', err)
        setStatus('error')
        setMessage(err.message || 'An error occurred')
      }
    }

    if (router.isReady && router.query.session_id) {
      processPayment()
    }
  }, [router.isReady, router.query.session_id, router])

  return (
    <>
      <Head>
        <title>
          {status === 'success' ? 'Payment Successful' : status === 'error' ? 'Payment Error' : 'Processing...'}
          - Laverdi.tech
        </title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          {status === 'loading' && (
            <>
              <div className="text-6xl mb-6 animate-spin">⏳</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Processing Payment</h1>
              <p className="text-gray-600">Confirming your upgrade...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left">
                <p className="text-gray-700 text-sm">Redirecting to dashboard...</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Error</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/checkout"
                  className="inline-block px-6 py-3 bg-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-400 transition-colors w-full"
                >
                  Try Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
