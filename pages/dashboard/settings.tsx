'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { getCurrentUser, updatePassword, signOut } from '@/lib/auth'

interface UserPreferences {
  email_notifications: boolean
  marketing_emails: boolean
  weekly_summary: boolean
  instance_alerts: boolean
  usage_alerts: boolean
}

export default function Settings() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    marketing_emails: false,
    weekly_summary: true,
    instance_alerts: true,
    usage_alerts: true,
  })
  const [loading, setLoading] = useState(true)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [emailVerificationCode, setEmailVerificationCode] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  // Preferences state
  const [preferencesLoading, setPreferencesLoading] = useState(false)
  const [preferencesError, setPreferencesError] = useState('')
  const [preferencesSuccess, setPreferencesSuccess] = useState('')

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        const supabase = createBrowserClient()

        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (userError) throw userError
        setUser(userData)
        setNewEmail(userData?.email || '')

        // Fetch preferences
        const { data: prefData } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (prefData) {
          setPreferences(prefData)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordLoading(true)

    try {
      if (!newPassword || !confirmPassword) {
        setPasswordError('Please fill in all password fields')
        setPasswordLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match')
        setPasswordLoading(false)
        return
      }

      if (newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters')
        setPasswordLoading(false)
        return
      }

      await updatePassword(newPassword)
      setPasswordSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')

    if (!newEmail || newEmail === user?.email) {
      setEmailError('Please enter a different email address')
      return
    }

    setEmailLoading(true)

    try {
      const response = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_email',
          new_email: newEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send verification email')
      }

      setShowEmailVerification(true)
      setEmailSuccess('Verification email sent. Check your inbox.')
    } catch (error: any) {
      setEmailError(error.message || 'Failed to update email')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    setEmailLoading(true)

    try {
      const response = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_email',
          code: emailVerificationCode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid verification code')
      }

      setEmailSuccess('Email updated successfully!')
      setShowEmailVerification(false)
      setEmailVerificationCode('')
      setUser({ ...user, email: newEmail })
    } catch (error: any) {
      setEmailError(error.message || 'Failed to verify email')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePreferencesUpdate() {
    setPreferencesError('')
    setPreferencesSuccess('')
    setPreferencesLoading(true)

    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      const response = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_preferences',
          preferences,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update preferences')
      }

      setPreferencesSuccess('Preferences updated successfully!')
    } catch (error: any) {
      setPreferencesError(error.message || 'Failed to update preferences')
    } finally {
      setPreferencesLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('')

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion')
      return
    }

    setDeleteLoading(true)

    try {
      const response = await fetch('/api/admin/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out and redirect
      await signOut()
      router.push('/auth/login?message=Account%20deleted%20successfully')
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
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
        <title>Settings - Laverdi.tech</title>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your account preferences and security</p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
                />
                <p className="text-gray-600 text-sm mt-2">
                  Email cannot be changed directly. Use the "Update Email" section below.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Account Tier</label>
                <input
                  type="text"
                  value={(user?.tier || 'n/a').toUpperCase()}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Member Since</label>
                <input
                  type="text"
                  value={
                    user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">User ID</label>
                <input
                  type="text"
                  value={user?.id || 'N/A'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Update Email Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Email</h2>

            {emailError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{emailError}</p>
              </div>
            )}

            {emailSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="text-green-700">{emailSuccess}</p>
              </div>
            )}

            {!showEmailVerification ? (
              <form onSubmit={handleEmailChange}>
                <div className="mb-6">
                  <label htmlFor="newEmail" className="block text-gray-700 font-semibold mb-2">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={emailLoading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {emailLoading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmail}>
                <div className="mb-6">
                  <label htmlFor="code" className="block text-gray-700 font-semibold mb-2">
                    Verification Code
                  </label>
                  <p className="text-gray-600 text-sm mb-4">
                    Check your email at {newEmail} for the verification code.
                  </p>
                  <input
                    type="text"
                    id="code"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    placeholder="000000"
                    disabled={emailLoading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50 font-mono text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailVerification(false)
                      setEmailVerificationCode('')
                    }}
                    disabled={emailLoading}
                    className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {emailLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

            {passwordError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="text-green-700">{passwordSuccess}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div className="mb-6">
                <label htmlFor="newPassword" className="block text-gray-700 font-semibold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                />
                <p className="text-gray-600 text-sm mt-2">Minimum 8 characters</p>
              </div>

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

            {preferencesError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{preferencesError}</p>
              </div>
            )}

            {preferencesSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="text-green-700">{preferencesSuccess}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {[
                {
                  key: 'email_notifications' as const,
                  label: 'Email Notifications',
                  description: 'Receive general email notifications',
                },
                {
                  key: 'marketing_emails' as const,
                  label: 'Marketing Emails',
                  description: 'Receive newsletters and promotional content',
                },
                {
                  key: 'weekly_summary' as const,
                  label: 'Weekly Summary',
                  description: 'Get a weekly summary of your account activity',
                },
                {
                  key: 'instance_alerts' as const,
                  label: 'Instance Alerts',
                  description: 'Alerts when instances are created or deleted',
                },
                {
                  key: 'usage_alerts' as const,
                  label: 'Usage Alerts',
                  description: 'Alerts when usage reaches certain thresholds',
                },
              ].map((pref) => (
                <label key={pref.key} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[pref.key]}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        [pref.key]: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer mt-0.5 flex-shrink-0"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-900">{pref.label}</p>
                    <p className="text-gray-600 text-sm">{pref.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handlePreferencesUpdate}
              disabled={preferencesLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {preferencesLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-900 mb-6">Danger Zone</h2>

            {deleteError && (
              <div className="bg-red-100 border-l-4 border-red-600 p-4 mb-6">
                <p className="text-red-800">{deleteError}</p>
              </div>
            )}

            {!showDeleteConfirm ? (
              <div>
                <p className="text-red-800 mb-6">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded">
                  <p className="text-red-900 font-semibold mb-4">
                    This action cannot be undone. Your account and all associated data will be permanently deleted.
                  </p>

                  <div className="mb-6">
                    <label htmlFor="deletePassword" className="block text-red-900 font-semibold mb-2">
                      Confirm with your password:
                    </label>
                    <input
                      type="password"
                      id="deletePassword"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={deleteLoading}
                      className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeletePassword('')
                        setDeleteError('')
                      }}
                      disabled={deleteLoading}
                      className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading || !deletePassword}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete Account Permanently'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
