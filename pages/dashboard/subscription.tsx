import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'

interface SubscriptionData {
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_subscription_id: string
}

export default function Subscription() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        const supabase = createBrowserClient()

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        setUser(userData)

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        setSubscription(subData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Subscription - Laverdi.tech</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="container-max h-16 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Laverdi.tech
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                ← Back to Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <div className="container-max py-12">
          <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

          {subscription && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-2">
                    Current Plan
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 capitalize mb-4">
                    {user?.tier}
                  </p>
                  <p className="text-gray-700">
                    <strong>Status:</strong>{' '}
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {subscription.status.charAt(0).toUpperCase() +
                        subscription.status.slice(1)}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-2">
                    Renewal Date
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700">
                    {subscription.cancel_at_period_end ? (
                      <span className="text-red-600">
                        ⚠️ Will cancel at renewal
                      </span>
                    ) : (
                      <span className="text-green-600">
                        ✓ Auto-renews at period end
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() =>
                    window.open('https://dashboard.stripe.com', '_blank')
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage in Stripe
                </button>

                {!subscription.cancel_at_period_end ? (
                  <button
                    onClick={() =>
                      window.open('https://dashboard.stripe.com', '_blank')
                    }
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      window.open('https://dashboard.stripe.com', '_blank')
                    }
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
            <h3 className="font-bold text-blue-900 mb-2">Need to upgrade?</h3>
            <p className="text-blue-800 mb-4">
              Change your plan anytime. You'll be charged a prorated amount based on the remaining billing period.
            </p>
            <div className="flex gap-4">
              <Link
                href="/checkout?plan=starter"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Starter
              </Link>
              <Link
                href="/checkout?plan=professional"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Professional
              </Link>
              <Link
                href="/checkout?plan=enterprise"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Enterprise
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
