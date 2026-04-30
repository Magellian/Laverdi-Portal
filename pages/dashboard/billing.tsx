'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'

interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: string
  plan: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

interface Invoice {
  id: string
  number: string
  date: string
  amount: number
  status: string
  paid_date?: string
}

interface BillingStats {
  total_paid_ytd: number
  next_billing_date: string | null
  invoices: Invoice[]
}

export default function Billing() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const planDetails: Record<string, { name: string; price: number; features: string[] }> = {
    starter: {
      name: 'Starter',
      price: 29,
      features: ['Up to 5 instances', '100 GB storage', 'Community support'],
    },
    professional: {
      name: 'Professional',
      price: 99,
      features: ['Up to 20 instances', '1 TB storage', 'Priority support', 'Advanced analytics'],
    },
    enterprise: {
      name: 'Enterprise',
      price: 299,
      features: ['Unlimited instances', 'Unlimited storage', '24/7 dedicated support', 'Custom integrations'],
    },
  }

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        const supabase = createBrowserClient()

        // Fetch user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        setUser(userData)

        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (subData) {
          setSubscription(subData)
        }

        // Fetch billing stats
        const response = await fetch('/api/admin/billing-stats')
        if (response.ok) {
          const stats = await response.json()
          setBillingStats(stats)
        }
      } catch (error) {
        console.error('Error loading billing data:', error)
        setError('Failed to load billing information')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleUpgradePlan(newPlan: string) {
    if (!subscription) {
      setError('No active subscription found')
      return
    }

    try {
      const response = await fetch('/api/stripe/upgrade-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.stripe_subscription_id,
          new_plan: newPlan,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upgrade plan')
      }

      setSuccess('Plan upgrade initiated. Redirecting to Stripe...')
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      setError(error.message || 'Failed to upgrade plan')
    }
  }

  async function handleDowngradePlan(newPlan: string) {
    if (!subscription) {
      setError('No active subscription found')
      return
    }

    if (!confirm('Are you sure you want to downgrade your plan?')) {
      return
    }

    try {
      const response = await fetch('/api/stripe/downgrade-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.stripe_subscription_id,
          new_plan: newPlan,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to downgrade plan')
      }

      setSuccess('Plan downgrade initiated. Changes will take effect at the end of your billing period.')
      
      // Reload subscription data
      const currentUser = await getCurrentUser()
      if (currentUser) {
        const supabase = createBrowserClient()
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (subData) {
          setSubscription(subData)
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to downgrade plan')
    }
  }

  async function handleCancelSubscription() {
    if (!subscription) {
      setError('No active subscription found')
      return
    }

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return
    }

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess('Subscription cancelled. You will have access until the end of your billing period.')
      
      // Reload subscription
      const currentUser = await getCurrentUser()
      if (currentUser) {
        const supabase = createBrowserClient()
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (subData) {
          setSubscription(subData)
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to cancel subscription')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'starter'
  const planInfo = planDetails[currentPlan]

  return (
    <>
      <Head>
        <title>Billing - Laverdi.tech</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Laverdi.tech
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                ← Back to Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your plan and view invoices</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Current Plan */}
          {subscription && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Plan</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {planInfo?.name || currentPlan}
                  </p>
                  <p className="text-gray-600">
                    ${planInfo?.price}/month
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Status</p>
                  <p className="text-lg font-semibold mb-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : subscription.status === 'past_due'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Next Billing Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {billingStats?.next_billing_date
                      ? new Date(billingStats.next_billing_date).toLocaleDateString()
                      : new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {planInfo && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Included Features</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {planInfo.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://dashboard.stripe.com/settings/sources"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    Manage Payment Methods
                  </a>
                  {currentPlan !== 'enterprise' && (
                    <button
                      onClick={() => {
                        const newPlan = currentPlan === 'starter' ? 'professional' : 'enterprise'
                        handleUpgradePlan(newPlan)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Upgrade Plan
                    </button>
                  )}
                  {currentPlan !== 'starter' && (
                    <button
                      onClick={() => {
                        const newPlan = currentPlan === 'enterprise' ? 'professional' : 'starter'
                        handleDowngradePlan(newPlan)
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                    >
                      Downgrade Plan
                    </button>
                  )}
                  {!subscription.cancel_at_period_end && (
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Billing Summary */}
          {billingStats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Amount Paid (YTD)</p>
                  <p className="text-4xl font-bold text-gray-900">
                    ${(billingStats.total_paid_ytd / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Invoices</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {billingStats.invoices.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoices */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Invoices</h2>

            {!billingStats || billingStats.invoices.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Invoice</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingStats.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-900">{invoice.number}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          ${(invoice.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <a
                            href={`#`}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            Download PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
