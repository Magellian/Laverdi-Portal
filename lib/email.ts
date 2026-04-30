// Using SendGrid REST API (HTTP) instead of SMTP
// This works from networks with SMTP/port 587 restrictions

let emailEnabled = process.env.EMAIL_ENABLED !== 'false'

// Runtime email settings (can be toggled by admin endpoint)
export function setEmailEnabled(enabled: boolean) {
  emailEnabled = enabled
  console.log('[Email] Email sending:', enabled ? 'ENABLED' : 'DISABLED')
}

export function isEmailEnabled() {
  return emailEnabled
}

async function sendViaAPI(options: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured')
  }

  const fromEmail = options.from || process.env.SENDGRID_FROM_EMAIL || 'chrislaverdiere@gmail.com'

  const payload = {
    personalizations: [
      {
        to: [{ email: options.to }],
      },
    ],
    from: { email: fromEmail },
    subject: options.subject,
    content: [
      {
        type: 'text/html',
        value: options.html,
      },
    ],
  }

  if (options.text) {
    ;(payload.content as any).push({
      type: 'text/plain',
      value: options.text,
    })
  }

  // Add timeout so SendGrid requests don't hang forever
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid API error: ${response.status} - ${error}`)
    }

    return response
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Would send to ${options.to}: "${options.subject}"`)
    return
  }

  try {
    await sendViaAPI(options)
    console.log(`[Email] Sent to ${options.to}: "${options.subject}"`)
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    throw error
  }
}

export async function sendWelcomeEmail(
  email: string,
  apiKey: string,
  tier: string
) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Welcome email would be sent to ${email}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const supportEmail = process.env.SENDGRID_SUPPORT_EMAIL || 'support@laverdi.tech'

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Welcome to LaVerdi OpenClaw! 🚀</h2>
      <p>Thank you for signing up for the <strong>${tier}</strong> plan!</p>
      
      <h3>Your API Key</h3>
      <p><code style="background: #f3f4f6; padding: 12px; border-radius: 4px; display: inline-block; font-family: monospace; word-break: break-all;">${apiKey}</code></p>
      <p style="color: #666; font-size: 12px;">⚠️ Keep this API key secure. Do not share it with anyone.</p>
      
      <h3>📖 Quick Start Guide</h3>
      <p style="margin-bottom: 15px;">
        <a href="${appUrl}/quickstart-guide.html" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          📖 Read the Quick Start Guide →
        </a>
      </p>
      <p>Your complete guide includes:</p>
      <ul>
        <li>✅ 10+ project ideas to get started (trading automation, email AI, web scraping, and more)</li>
        <li>✅ Step-by-step setup for 3 messaging channels (Telegram, WhatsApp, Discord)</li>
        <li>✅ Week 1 roadmap with daily milestones</li>
        <li>✅ Troubleshooting & support resources</li>
      </ul>

      <h3>Next Steps</h3>
      <ol>
        <li><strong>Download your guide</strong> (attached as PDF)</li>
        <li><strong>Visit your dashboard:</strong> <a href="${appUrl}/dashboard" style="color: #3B82F6;">${appUrl}/dashboard</a></li>
        <li><strong>Set up messaging</strong> (Telegram recommended for fastest setup)</li>
        <li><strong>Deploy your first automation</strong> within 24 hours</li>
      </ol>

      <p style="margin-top: 20px;">
        <a href="${appUrl}/dashboard" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Go to Dashboard →
        </a>
      </p>
      
      <h3>Questions?</h3>
      <p style="color: #666;">
        <strong>Support:</strong> <a href="mailto:${supportEmail}" style="color: #3B82F6;">${supportEmail}</a><br>
        <strong>Community:</strong> <a href="https://discord.gg/clawd" style="color: #3B82F6;">Join Discord</a><br>
        <strong>Docs:</strong> <a href="https://docs.openclaw.ai" style="color: #3B82F6;">Full Documentation</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        LaVerdi OpenClaw • <a href="${appUrl}" style="color: #3B82F6;">laverdi.tech</a><br>
        © 2026 LaVerdi. All rights reserved.
      </p>
    </div>
  `

  try {
    await sendViaAPI({
      to: email,
      subject: 'Welcome to LaVerdi OpenClaw - Your API Key + Quick Start Guide 🚀',
      html: htmlContent,
    })
    console.log(`[Email] Welcome email sent to ${email}`)
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error)
    throw error
  }
}

export async function sendReceiptEmail(
  email: string,
  planName: string,
  amount: number,
  invoiceUrl: string
) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Receipt email would be sent to ${email}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const billingEmail = process.env.SENDGRID_BILLING_EMAIL || 'billing@laverdi.tech'

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">💳 Payment Confirmation</h2>
      <p>Thank you for your payment!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; font-weight: bold; color: #374151;">Plan</td>
          <td style="padding: 12px; text-align: right; color: #111827;">${planName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; font-weight: bold; color: #374151;">Amount</td>
          <td style="padding: 12px; text-align: right; color: #111827;">$${(amount / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: bold; color: #374151;">Date</td>
          <td style="padding: 12px; text-align: right; color: #111827;">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
      
      <p style="margin-top: 20px;">
        <a href="${invoiceUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Full Invoice
        </a>
      </p>

      <p style="color: #666; margin-top: 30px;">
        Billing questions? Contact <a href="mailto:${billingEmail}">${billingEmail}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        LaVerdi OpenClaw • <a href="${appUrl}" style="color: #3B82F6;">laverdi.tech</a><br>
        © 2026 LaVerdi. All rights reserved.
      </p>
    </div>
  `

  try {
    await sendViaAPI({
      to: email,
      subject: 'Payment Confirmation - Laverdi.tech OpenClaw',
      html: htmlContent,
    })
    console.log(`Receipt email sent to ${email}`)
  } catch (error) {
    console.error('Failed to send receipt email:', error)
  }
}

// ---------------------------------------------------------------------------
// Free-trial lifecycle email stubs
// These log to console now. Hook up real sends in a future sprint.
// ---------------------------------------------------------------------------

/**
 * Day-7 trial reminder.
 * Called by a scheduled job 7 days after trial_started_at.
 */
export async function sendTrialReminderEmail(
  email: string,
  daysLeft: number
): Promise<void> {
  // TODO: send real email — subject "Your Laverdi trial ends in X days"
  console.log(`[EMAIL STUB] sendTrialReminderEmail → ${email} (${daysLeft} days left)`)
}

/**
 * Day-15 (trial expiry) email.
 * Called by a scheduled job when trial_expires_at is reached.
 */
export async function sendTrialExpiringEmail(email: string): Promise<void> {
  // TODO: send real email — subject "Your Laverdi trial has expired"
  console.log(`[EMAIL STUB] sendTrialExpiringEmail → ${email}`)
}

/**
 * Upgrade prompt sent when a user hits or approaches their call limit.
 */
export async function sendUpgradePromptEmail(email: string): Promise<void> {
  // TODO: send real email — subject "You've reached your Laverdi call limit"
  console.log(`[EMAIL STUB] sendUpgradePromptEmail → ${email}`)
}

// ---------------------------------------------------------------------------

export async function sendInstanceReadyEmail(
  email: string,
  ipAddress: string
) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Instance ready email would be sent to ${email}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const supportEmail = process.env.SENDGRID_SUPPORT_EMAIL || 'support@laverdi.tech'

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">🚀 Your OpenClaw Instance is Ready!</h2>
      <p>Great news! Your dedicated OpenClaw instance has been successfully provisioned and is now online.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6;">
        <h3 style="margin-top: 0;">Instance Details</h3>
        <p style="margin-bottom: 5px;"><strong>IP Address:</strong></p>
        <p style="background: white; padding: 10px; border-radius: 4px; font-family: monospace; margin-bottom: 0;">${ipAddress}</p>
      </div>
      
      <h3>Next Steps</h3>
      <ol>
        <li>Open your local OpenClaw app</li>
        <li>Go to the <strong>Connect</strong> tab</li>
        <li>Select <strong>Remote VPS</strong></li>
        <li>Enter your instance IP address: <code>${ipAddress}</code></li>
      </ol>

      <p style="margin-top: 20px;">
        <a href="${appUrl}/dashboard" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Your Dashboard
        </a>
      </p>
      
      <p style="color: #666; margin-top: 30px;">
        Questions? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        LaVerdi OpenClaw • <a href="${appUrl}" style="color: #3B82F6;">laverdi.tech</a><br>
        © 2026 LaVerdi. All rights reserved.
      </p>
    </div>
  `

  try {
    await sendViaAPI({
      to: email,
      subject: '🚀 Your OpenClaw Instance is Ready',
      html: htmlContent,
    })
    console.log(`Instance ready email sent to ${email}`)
  } catch (error) {
    console.error('Failed to send instance ready email:', error)
  }
}
