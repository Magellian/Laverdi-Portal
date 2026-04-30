/**
 * Admin Email Settings Endpoint
 * GET: Retrieve current email settings
 * POST: Update email settings (toggle on/off)
 */

import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  success: boolean
  settings?: {
    emailEnabled: boolean
    provider?: string
    fromEmail?: string
    testMode?: boolean
  }
  error?: string
  message?: string
}

// Store email settings in memory (reset on server restart)
// In production, store in database
let emailSettings = {
  emailEnabled: process.env.EMAIL_ENABLED !== 'false',
  testMode: process.env.NODE_ENV !== 'production',
  provider: process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp',
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@laverdi.tech',
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[EmailSettings]', { method: req.method, path: req.url })

  // Verify admin token
  const adminToken = process.env.ADMIN_UPGRADE_TOKEN || 'admin-token-change-me-in-production'
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing authorization header',
    })
  }

  const token = authHeader.substring(7)
  if (token !== adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin token',
    })
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      settings: emailSettings,
    })
  }

  if (req.method === 'POST') {
    const { emailEnabled, testMode } = req.body

    if (emailEnabled !== undefined) {
      emailSettings.emailEnabled = emailEnabled
      console.log('[EmailSettings] Email toggled:', emailEnabled ? 'ON' : 'OFF')
    }

    if (testMode !== undefined) {
      emailSettings.testMode = testMode
      console.log('[EmailSettings] Test mode:', testMode ? 'ON' : 'OFF')
    }

    return res.status(200).json({
      success: true,
      message: 'Email settings updated',
      settings: emailSettings,
    })
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  })
}

// Export settings getter for use in email.ts
export function getEmailSettings() {
  return emailSettings
}
