'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'

interface ApiKey {
  id: string
  user_id: string
  name: string
  key: string
  status: 'active' | 'revoked'
  created_at: string
  last_used_at: string | null
}

interface NewKeyResponse {
  id: string
  key: string
  message: string
}

export default function ApiKeys() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showNewKey, setShowNewKey] = useState<NewKeyResponse | null>(null)
  const [copied, setCopied] = useState(false)

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

        // Fetch API keys
        const { data: keysData, error: keysError } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })

        if (keysError) throw keysError
        setApiKeys(keysData || [])
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load API keys')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newKeyName.trim()) {
      setError('Please enter a key name')
      return
    }

    setCreating(true)

    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setError('You must be logged in')
        return
      }

      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          name: newKeyName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create API key')
      }

      const data: NewKeyResponse = await response.json()
      setShowNewKey(data)
      setNewKeyName('')
      setSuccess('API key created successfully')

      // Reload keys
      const supabase = createBrowserClient()
      const { data: keysData } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      setApiKeys(keysData || [])
    } catch (error: any) {
      setError(error.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const supabase = createBrowserClient()
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', id)

      if (updateError) throw updateError

      setApiKeys(apiKeys.filter((k) => k.id !== id))
      setSuccess('API key revoked successfully')
    } catch (error: any) {
      setError(error.message || 'Failed to revoke API key')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function maskKey(key: string) {
    if (key.length <= 8) return key
    return key.substring(0, 8) + '*'.repeat(Math.max(0, key.length - 16)) + key.substring(key.length - 8)
  }

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
        <title>API Keys - Laverdi.tech</title>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">API Keys</h1>
            <p className="text-gray-600">Manage API keys for authenticating requests to Laverdi APIs</p>
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

          {/* New Key Display Modal */}
          {showNewKey && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Your new API key has been created</h3>
              <p className="text-blue-700 mb-4">
                Save this key somewhere safe. You won't be able to see it again.
              </p>
              <div className="bg-white border border-blue-200 rounded p-4 mb-4">
                <code className="text-sm break-all font-mono text-gray-900">{showNewKey.key}</code>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => copyToClipboard(showNewKey.key)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => setShowNewKey(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your API Keys</h2>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                + Create New Key
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <p className="text-gray-600 mb-4">No API keys yet</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Create your first key
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              key.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded p-3 mb-3 font-mono text-sm break-all">
                          {maskKey(key.key)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Created</p>
                            <p className="font-medium text-gray-900">
                              {new Date(key.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Last Used</p>
                            <p className="font-medium text-gray-900">
                              {key.last_used_at
                                ? new Date(key.last_used_at).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                          title="Copy key"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          disabled={key.status === 'revoked'}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New API Key</h2>

            <form onSubmit={handleCreateKey}>
              <div className="mb-6">
                <label htmlFor="keyName" className="block text-gray-700 font-semibold mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production, Development, Testing"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
                  disabled={creating}
                />
                <p className="text-gray-600 text-sm mt-2">
                  Choose a descriptive name to identify this key
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setNewKeyName('')
                  }}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
