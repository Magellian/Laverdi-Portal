import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'
import { maskApiKey } from '@/lib/api-key'
// import { WelcomeLanding } from '@/components/WelcomeLanding'
import { TrialBanner } from '@/components/TrialBanner'
import FileBrowser from '@/components/FileBrowser'

// Fallback call limits used when monthly_call_limit column is not yet populated
const TIER_CALL_LIMITS: Record<string, number> = {
  free: 100,
  trial: 500,
  starter: 5000,
  professional: 20000,
  enterprise: 100000,
}

interface UserData {
  id: string
  email: string
  tier: string
  api_key: string
  created_at: string
  trial_expires_at?: string | null
  monthly_call_limit?: number
}

interface SubscriptionData {
  status: string
  current_period_end: string
}

interface InstanceData {
  id: string
  user_id: string
  droplet_id: string | null
  ip_address: string | null
  port?: number | null
  status: 'provisioning' | 'ready' | 'failed'
  pairing_token?: string | null
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [usage, setUsage] = useState({ current: 0, limit: 100 })
  const [showWelcome, setShowWelcome] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserData() {
      try {
        
        // Debug: log session state on dashboard load
        console.log('[Dashboard] Loading user data...')
        
        const currentUser = await getCurrentUser()
        console.log('[Dashboard] getCurrentUser result:', {
          exists: !!currentUser,
          email: currentUser?.email,
          id: currentUser?.id
        })
        
        if (!currentUser) {
          console.log('[Dashboard] No user found, redirecting to login')
          router.push('/auth/login')
          return
        }

        const supabase = createBrowserClient()
        
        // Store auth token for API calls (file browser etc.)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (authSession?.access_token) {
          setAuthToken(authSession.access_token)
        }

        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, create a default profile
          throw userError
        }

        // If no profile exists, create one via API
        if (!userData || userError?.code === 'PGRST116') {
          try {
            const response = await fetch('/api/auth/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUser.id,
                email: currentUser.email,
              }),
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Failed to create profile')
            }

            const { user: newUser } = await response.json()
            setUser(newUser)
          } catch (error) {
            console.error('Error creating user profile:', error)
            throw error
          }
        } else {
          setUser(userData)
        }

        // Fetch real call usage for the current month
        const activeUser = userData || user
        if (activeUser) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const { count } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .gte('timestamp', startOfMonth.toISOString())

          const callLimit =
            activeUser.monthly_call_limit ??
            TIER_CALL_LIMITS[activeUser.tier] ??
            100

          setUsage({ current: count ?? 0, limit: callLimit })
        }

        // Check if this is first-time load
        const hasSeenWelcome = localStorage.getItem('laverdi_seen_welcome')
        if (userData && !hasSeenWelcome) {
          setShowWelcome(true)
          localStorage.setItem('laverdi_seen_welcome', 'true')
        }

        // Fetch subscription data
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (!subError && subData) {
          setSubscription(subData)
        }

        // Fetch instance data
        const { data: instData, error: instError } = await supabase
          .from('instances')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!instError && instData) {
          setInstance(instData)
          // If still provisioning, poll every 5s until ready
          if (instData.status === 'provisioning') {
            const pollInterval = setInterval(async () => {
              const { data: updated } = await supabase
                .from('instances')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
              if (updated && updated.status !== 'provisioning') {
                setInstance(updated)
                clearInterval(pollInterval)
              }
            }, 5000)
            // Clean up on unmount
            return () => clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show welcome landing on first load (disabled for now)
  // if (showWelcome && user) {
  //   return (
  //     <WelcomeLanding
  //       userName={user.email.split('@')[0]}
  //       onComplete={() => setShowWelcome(false)}
  //     />
  //   )
  // }

  const usagePercent = (usage.current / usage.limit) * 100
  const renewalDate = subscription
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : 'N/A'

  return (
    <>
      <Head>
        <title>Dashboard - Laverdi.tech</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Trial / free-tier banner */}
        <TrialBanner tier={user.tier} trialExpiresAt={user.trial_expires_at} />

        {/* Header */}
        <nav className="bg-white shadow-md">
          <div className="container-max h-16 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Laverdi.tech
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user.email}</span>
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

        {/* Dashboard Content */}
        <div className="container-max py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Tier Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                Current Plan
              </h3>
              <p className="text-3xl font-bold text-blue-600 capitalize">
                {user.tier === 'starter' && user.trial_expires_at && !user.trial_converted
                  ? 'Free Trial'
                  : user.tier}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Renews on {renewalDate}
              </p>
              <Link
                href="/dashboard/subscription"
                className="text-blue-600 text-sm hover:underline mt-4 inline-block"
              >
                Manage Plan →
              </Link>
            </div>

            {/* API Key Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                API Key
              </h3>
              <div className="bg-gray-100 rounded p-3 font-mono text-sm break-all">
                {showApiKey ? user.api_key : maskApiKey(user.api_key)}
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-blue-600 text-sm hover:underline mt-2"
              >
                {showApiKey ? 'Hide' : 'Show'} Key
              </button>
            </div>

            {/* Member Since */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                Member Since
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {Math.floor(
                  (Date.now() - new Date(user.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days ago
              </p>
            </div>
          </div>

          {/* Instance Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-12 border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Agent Server Status</h2>
              {instance?.status === 'ready' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Online
                </span>
              )}
              {instance?.status === 'provisioning' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium animate-pulse">
                  Provisioning...
                </span>
              )}
              {instance?.status === 'failed' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Failed
                </span>
              )}
              {!instance && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  Not Provisioned
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-600 text-sm font-semibold mb-1">IP Address</h3>
                <div className="font-mono bg-gray-50 p-2 rounded border border-gray-200">
                  {instance?.ip_address ? (
                    <span className="text-gray-900">{instance.ip_address}</span>
                  ) : (
                    <span className="text-gray-400 italic">Waiting for assignment...</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-600 text-sm font-semibold mb-1">Server Port</h3>
                <div className="font-mono bg-gray-50 p-2 rounded border border-gray-200">
                  {instance?.port ? (
                    <span className="text-gray-900">{instance.port}</span>
                  ) : (
                    <span className="text-gray-400 italic">8700 (default)</span>
                  )}
                </div>
              </div>
            </div>
            
            {instance?.status === 'provisioning' && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-sm font-medium text-blue-600">Setting up your OpenClaw instance...</p>
                </div>
                <p className="text-sm text-gray-500">
                  Your dedicated agent is being configured. This usually takes about 60 seconds. The page will update automatically when it's ready.
                </p>
              </div>
            )}
            
            {instance?.status === 'ready' && instance?.port && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-2">Access your OpenClaw remote agent via the API or Companion App using this IP address and port.</p>
                <div className="flex gap-4">
                  <a href={`https://laverdi.tech/agent/${instance.port}/?gatewayUrl=${encodeURIComponent(`wss://laverdi.tech/agent/${instance.port}`)}#token=${instance.api_key || ''}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    Open Web Interface →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Workspace Files */}
          {instance?.status === 'ready' && authToken && (
            <div className="mb-12">
              <FileBrowser authToken={authToken} />
            </div>
          )}

          {/* Usage Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-12">
            <h2 className="text-2xl font-bold mb-6">Token Usage</h2>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">API Requests</span>
                <span className="text-gray-600">
                  {usage.current.toLocaleString()} / {usage.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    usagePercent > 90
                      ? 'bg-red-500'
                      : usagePercent > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-gray-600 text-sm mt-2">
                {Math.round(usagePercent)}% of monthly quota used
              </p>
              {usagePercent >= 90 && (
                <p className="text-red-600 text-sm font-semibold mt-2">
                  You are near your monthly limit.{' '}
                  <Link href="/checkout/subscribe" className="underline hover:text-red-800">
                    Upgrade your plan
                  </Link>{' '}
                  to avoid service interruption.
                </p>
              )}
              {usagePercent >= 70 && usagePercent < 90 && (
                <p className="text-yellow-700 text-sm mt-2">
                  Approaching your monthly limit.{' '}
                  <Link href="/checkout/subscribe" className="underline hover:text-yellow-900">
                    Consider upgrading
                  </Link>{' '}
                  before you run out.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/dashboard/api-keys"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold mb-2">Manage API Keys</h3>
              <p className="text-gray-600 text-sm">
                Create, revoke, or rotate your API keys
              </p>
            </Link>

            <Link
              href="/dashboard/settings"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold mb-2">Account Settings</h3>
              <p className="text-gray-600 text-sm">
                Update your profile and preferences
              </p>
            </Link>

            <Link
              href="/dashboard/billing"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold mb-2">Billing</h3>
              <p className="text-gray-600 text-sm">
                View invoices and payment methods
              </p>
            </Link>

            <Link
              href="/docs"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold mb-2">Documentation</h3>
              <p className="text-gray-600 text-sm">
                Learn how to use the Laverdi.tech API
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
