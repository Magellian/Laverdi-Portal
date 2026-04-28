// SendGrid HTTP API v3 — no SMTP needed (DO blocks port 587)

let emailEnabled = process.env.EMAIL_ENABLED !== 'false'

export function setEmailEnabled(enabled: boolean) {
  emailEnabled = enabled
  console.log('[Email] Email sending:', enabled ? 'ENABLED' : 'DISABLED')
}

export function isEmailEnabled() {
  return emailEnabled
}

async function sendViaSendGrid(to: string, subject: string, html: string, text?: string) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.error('[Email] SENDGRID_API_KEY not set')
    throw new Error('SendGrid API key not configured')
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@laverdi.tech'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const body: any = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: 'LaVerdi' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }
    if (text) {
      body.content.unshift({ type: 'text/plain', value: text })
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`SendGrid ${res.status}: ${err}`)
    }

    console.log(`[Email] Sent to ${to}: "${subject}"`)
  } finally {
    clearTimeout(timeout)
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
  await sendViaSendGrid(options.to, options.subject, options.html, options.text)
}

export async function sendWelcomeEmail(email: string, apiKey: string, tier: string) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Welcome email would be sent to ${email}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const supportEmail = process.env.SENDGRID_SUPPORT_EMAIL || 'support@laverdi.tech'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Welcome to LaVerdi OpenClaw! 🚀</h2>
      <p>Thank you for signing up for the <strong>${tier}</strong> plan!</p>
      <h3>Your API Key</h3>
      <p><code style="background: #f3f4f6; padding: 12px; border-radius: 4px; display: inline-block; font-family: monospace; word-break: break-all;">${apiKey}</code></p>
      <p style="color: #666; font-size: 12px;">⚠️ Keep this API key secure. Do not share it with anyone.</p>
      <h3>Next Steps</h3>
      <ol>
        <li><strong>Visit your dashboard:</strong> <a href="${appUrl}/dashboard">${appUrl}/dashboard</a></li>
        <li><strong>Set up messaging</strong> (Telegram recommended)</li>
        <li><strong>Deploy your first automation</strong></li>
      </ol>
      <p style="margin-top: 20px;"><a href="${appUrl}/dashboard" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Go to Dashboard →</a></p>
      <p style="color: #666; margin-top: 30px;">Questions? <a href="mailto:${supportEmail}">${supportEmail}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">LaVerdi OpenClaw • <a href="${appUrl}">laverdi.tech</a><br>© 2026 LaVerdi. All rights reserved.</p>
    </div>
  `

  await sendViaSendGrid(email, 'Welcome to LaVerdi OpenClaw - Your API Key 🚀', html)
}

export async function sendReceiptEmail(email: string, planName: string, amount: number, invoiceUrl: string) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Receipt email would be sent to ${email}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const billingEmail = process.env.SENDGRID_BILLING_EMAIL || 'billing@laverdi.tech'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">💳 Payment Confirmation</h2>
      <p>Thank you for your payment!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 12px; font-weight: bold;">Plan</td><td style="padding: 12px; text-align: right;">${planName}</td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 12px; font-weight: bold;">Amount</td><td style="padding: 12px; text-align: right;">$${(amount / 100).toFixed(2)}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Date</td><td style="padding: 12px; text-align: right;">${new Date().toLocaleDateString()}</td></tr>
      </table>
      <p><a href="${invoiceUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Invoice</a></p>
      <p style="color: #666; margin-top: 30px;">Billing questions? <a href="mailto:${billingEmail}">${billingEmail}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">LaVerdi OpenClaw • <a href="${appUrl}">laverdi.tech</a><br>© 2026 LaVerdi. All rights reserved.</p>
    </div>
  `

  await sendViaSendGrid(email, 'Payment Confirmation - LaVerdi OpenClaw', html)
}

export async function sendTrialReminderEmail(email: string, daysLeft: number): Promise<void> {
  console.log(`[EMAIL STUB] sendTrialReminderEmail → ${email} (${daysLeft} days left)`)
}

export async function sendTrialExpiringEmail(email: string): Promise<void> {
  console.log(`[EMAIL STUB] sendTrialExpiringEmail → ${email}`)
}

export async function sendUpgradePromptEmail(email: string): Promise<void> {
  console.log(`[EMAIL STUB] sendUpgradePromptEmail → ${email}`)
}

export async function sendInstanceReadyEmail(email: string, ipAddress: string) {
  if (!emailEnabled) {
    console.log(`[Email] DISABLED - Instance ready email would be sent to ${email}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'
  const supportEmail = process.env.SENDGRID_SUPPORT_EMAIL || 'support@laverdi.tech'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">🚀 Your OpenClaw Instance is Ready!</h2>
      <p>Your dedicated OpenClaw instance is now online.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6;">
        <h3 style="margin-top: 0;">Instance Details</h3>
        <p><strong>IP Address:</strong> <code>${ipAddress}</code></p>
      </div>
      <p><a href="${appUrl}/dashboard" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Dashboard</a></p>
      <p style="color: #666; margin-top: 30px;">Questions? <a href="mailto:${supportEmail}">${supportEmail}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">LaVerdi OpenClaw • <a href="${appUrl}">laverdi.tech</a><br>© 2026 LaVerdi. All rights reserved.</p>
    </div>
  `

  await sendViaSendGrid(email, '🚀 Your OpenClaw Instance is Ready', html)
}
