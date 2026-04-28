// pages/dashboard/index.tsx - with client-side dynamic button rendering

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
  model_id?: string
  created_at: string
  trial_expires_at?: string | null
  monthly_call_limit?: number
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
  const [loading, setLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)

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
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
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
                  router.push('/')
                }}
                className="text-gray-600 hover:text-gray-900 text-xs sm:text-base"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* OpenClaw Button - PROMINENTLY DISPLAYED */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Your OpenClaw Instance
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {user.tier === 'free' && '🚀 Claude Haiku — Fast and efficient'}
                {user.tier === 'starter' && '⚡ Claude Sonnet — Balanced and powerful'}
                {user.tier === 'professional' && '🧠 Claude Opus — Advanced reasoning'}
              </p>
              
              {/* Download Buttons */}
              <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-3">
                    Choose your operating system to download the connector:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a
                      href="/api/openclaw/download-connector?os=windows"
                      download="laverdi-openclaw-connect.bat"
                      className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      💻 Windows
                    </a>
                    <a
                      href="/api/openclaw/download-connector?os=mac"
                      download="laverdi-openclaw-connect.sh"
                      className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      🍎 Mac
                    </a>
                    <a
                      href="/api/openclaw/download-connector?os=linux"
                      download="laverdi-openclaw-connect.sh"
                      className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      🐧 Linux
                    </a>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    ↓ Download the script for your OS above, then run it. It will automatically open your OpenClaw instance.
                  </p>
              </div>

              <details className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded mt-4">
                <summary className="font-semibold cursor-pointer text-gray-700">
                  Manual setup (advanced)
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="font-mono bg-white p-2 rounded border border-gray-200 break-all">
                    ssh -L 9000:localhost:9000 root@64.23.142.154
                  </p>
                  <p>Then open: <code className="bg-white px-1 rounded">http://localhost:9000</code></p>
                </div>
              </details>
            </div>
          </div>

          {/* Info Cards Grid - Mobile Friendly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Tier Card */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold mb-2">
                Current Plan
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 capitalize">
                {user.tier}
              </p>
              <Link
                href="/dashboard/subscription"
                className="text-blue-600 text-xs sm:text-sm hover:underline mt-4 inline-block"
              >
                Manage Plan →
              </Link>
            </div>

            {/* API Key Card */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold mb-2">
                API Key
              </h3>
              <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all">
                {showApiKey ? user.api_key : maskApiKey(user.api_key)}
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-blue-600 text-xs sm:text-sm hover:underline mt-2"
              >
                {showApiKey ? 'Hide' : 'Show'} Key
              </button>
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

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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
