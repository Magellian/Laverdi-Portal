/**
 * Admin Send Test Email Endpoint
 * POST /api/admin/send-test-email
 * 
 * Sends a test email to verify email configuration
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { sendEmail } from '@/lib/email'

type ResponseData = {
  success: boolean
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[SendTestEmail] Request received:', { method: req.method })

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

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

  try {
    const { to } = req.body

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required',
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      })
    }

    console.log('[SendTestEmail] Sending test email to:', to)

    // Send test email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">🧪 Test Email from Laverdi</h2>
        
        <p style="color: #666; line-height: 1.6;">
          This is a test email to verify your email configuration is working correctly.
        </p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; color: #374151;">
            <strong>Test Details:</strong><br>
            Sent at: ${new Date().toISOString()}<br>
            From: noreply@laverdi.tech
          </p>
        </div>

        <p style="color: #666; line-height: 1.6;">
          If you received this email, your email configuration is working correctly!
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This is an automated test email from Laverdi.tech OpenClaw
        </p>
      </div>
    `

    await sendEmail({
      to,
      subject: '🧪 Test Email from Laverdi.tech',
      html: htmlContent,
      text: 'This is a test email from Laverdi.tech. If you received this, your email configuration is working correctly!',
    })

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${to}`,
    })
  } catch (error: any) {
    console.error('[SendTestEmail] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
    })
  }
}
