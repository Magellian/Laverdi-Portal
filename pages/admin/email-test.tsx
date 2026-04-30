import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function EmailTestDashboard() {
  const [settings, setSettings] = useState<{
    emailEnabled: boolean
    provider: string
    fromEmail: string
    testMode: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [testEmail, setTestEmail] = useState('test@example.com')

  const adminToken = 'admin-token-change-me-in-production'

  // Fetch current settings
  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/email-settings', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setMessage('Failed to fetch email settings')
    }
  }

  async function toggleEmail() {
    if (!settings) return
    setLoading(true)

    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailEnabled: !settings.emailEnabled,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
        setMessage(
          `✓ Email ${!settings.emailEnabled ? 'enabled' : 'disabled'}`
        )
      }
    } catch (error) {
      console.error('Failed to toggle email:', error)
      setMessage('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  async function toggleTestMode() {
    if (!settings) return
    setLoading(true)

    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode: !settings.testMode,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
        setMessage(`✓ Test mode ${!settings.testMode ? 'enabled' : 'disabled'}`)
      }
    } catch (error) {
      console.error('Failed to toggle test mode:', error)
      setMessage('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  async function sendTestEmail() {
    if (!testEmail) {
      setMessage('Please enter a test email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`✓ Test email sent to ${testEmail}`)
      } else {
        setMessage(`✗ Failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      setMessage('Failed to send test email')
    } finally {
      setLoading(false)
    }
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Email Test Dashboard - Laverdi Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">📧 Email Settings</h1>
            <p className="text-gray-600 mt-2">
              Admin dashboard for testing email functionality
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.startsWith('✓')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : message.startsWith('✗')
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow divide-y">
            {/* Email Status */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Email Sending
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {settings.emailEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                  </p>
                </div>
                <button
                  onClick={toggleEmail}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    settings.emailEnabled
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {settings.emailEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Test Mode */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Test Mode
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {settings.testMode
                      ? '📝 Logs to console instead of sending'
                      : '📤 Sends real emails'}
                  </p>
                </div>
                <button
                  onClick={toggleTestMode}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    settings.testMode
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {settings.testMode ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Configuration */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configuration
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-mono ml-2 text-gray-900">
                    {settings.provider}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">From Address:</span>
                  <span className="font-mono ml-2 text-gray-900">
                    {settings.fromEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Send Test Email */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Send Test Email
              </h2>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={loading || !settings.emailEnabled}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {settings.testMode
                  ? '📝 In test mode - email will be logged to console instead'
                  : '📤 Will send a real test email'}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> During development, enable "Test Mode"
              to log emails to the console instead of actually sending them. In
              production, disable test mode and ensure your email provider is
              configured.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
