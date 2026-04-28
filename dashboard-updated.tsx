// pages/dashboard/index.tsx - Updated with direct HTTPS launch button

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'
import { maskApiKey } from '@/lib/api-key'
import { TrialBanner } from '@/components/TrialBanner'

interface UserData {
  id: string
  email: string
  tier: string
  api_key: string
  created_at: string
  trial_expires_at?: string | null
  monthly_call_limit?: number
}

interface InstanceData {
  authToken: string
  url: string
  model: string
  status: string
}

const TIER_CALL_LIMITS: Record<string, number> = {
  free: 100,
  trial: 500,
  starter: 5000,
  professional: 20000,
  enterprise: 100000,
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [instanceLoading, setInstanceLoading] = useState(true)

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        const supabase = createBrowserClient()

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (userError) throw userError

        setUser(userData)

        // Fetch instance info
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          try {
            const response = await fetch('/api/openclaw/get-instance', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            })

            if (response.ok) {
              const instanceData = await response.json()
              setInstance(instanceData)
            }
          } catch (err) {
            console.log('Instance not yet provisioned:', err)
          }
        }

      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
        setInstanceLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const callLimit = TIER_CALL_LIMITS[user.tier] || 0

  return (
    <>
      <Head>
        <title>Dashboard - Laverdi.tech</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Trial Banner */}
        <TrialBanner tier={user.tier} trialExpiresAt={user.trial_expires_at} />

        {/* Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600">
              Laverdi.tech
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-gray-700 text-xs sm:text-base truncate">{user.email}</span>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/auth/login')
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {/* Tier & OpenClaw Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Current Tier Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Current Tier</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 capitalize mb-3">{user.tier}</p>
              <p className="text-sm text-gray-600 mb-4">
                {user.tier === 'free' && '🚀 Claude Haiku — Fast and efficient'}
                {user.tier === 'starter' && '⚡ Claude Sonnet — Balanced and powerful'}
                {user.tier === 'professional' && '🧠 Claude Opus — Advanced reasoning'}
              </p>
              
              {/* Launch OpenClaw - Direct HTTPS Link */}
              <div className="space-y-3 mt-6">
                {!instanceLoading && instance?.authToken ? (
                  <a
                    href={instance.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all text-center text-base shadow-lg"
                  >
                    ✨ Launch OpenClaw Agent
                  </a>
                ) : instanceLoading ? (
                  <div className="bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-center text-sm">
                    Loading instance...
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Your agent container is being provisioned... This usually takes 1-2 minutes after signup. Please refresh this page in a moment.
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Opens in a new window. Your AI agent is running securely.
                </p>
              </div>
            </div>

            {/* API Usage Card */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold mb-2">
                Monthly API Calls
              </h3>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {callLimit.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Per month limit for your tier
              </p>
            </div>

            {/* Member Since Card */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold mb-2">
                Member Since
              </h3>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* API Key Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">API Key</h3>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-xs sm:text-sm break-all">
              {showApiKey ? user.api_key : maskApiKey(user.api_key)}
            </div>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-blue-600 text-xs sm:text-sm hover:underline mt-2"
            >
              {showApiKey ? 'Hide' : 'Show'} Key
            </button>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Email</p>
                <p className="text-gray-900 font-medium break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-600">User ID</p>
                <p className="text-gray-900 font-mono text-xs break-all">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// CRITICAL: Force server-side rendering (prevents static pre-generation)
export const getServerSideProps = async () => {
  return {
    props: {},
  }
}
