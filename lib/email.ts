import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendWelcomeEmail(
  to: string,
  tierName: string,
  apiKey?: string
) {
  const subject = `Welcome to LaVerdi — Your ${tierName} plan is active!`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #d4d4d8; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { color: #fff; font-size: 28px; margin: 0 0 8px; }
    .header p { color: #a1a1aa; font-size: 16px; margin: 0; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card h2 { color: #fff; font-size: 18px; margin: 0 0 16px; }
    .step { display: flex; gap: 12px; margin-bottom: 16px; }
    .step-num { flex-shrink: 0; width: 24px; height: 24px; background: #27272a; color: #fff; border-radius: 50%; font-size: 13px; font-weight: 600; text-align: center; line-height: 24px; }
    .step-text h3 { color: #d4d4d8; font-size: 14px; font-weight: 600; margin: 0 0 4px; }
    .step-text p { color: #71717a; font-size: 13px; margin: 0; }
    .api-key { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 13px; color: #22c55e; word-break: break-all; margin: 12px 0; }
    .btn { display: inline-block; background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; }
    .footer { text-align: center; margin-top: 32px; color: #52525b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're in! 🎉</h1>
      <p>Your LaVerdi ${tierName} plan is now active.</p>
    </div>

    <div class="card">
      <h2>Getting Started</h2>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">
          <h3>Open your dashboard</h3>
          <p>Sign in at laverdi.tech to manage your agents.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">
          <h3>Deploy your first agent</h3>
          <p>Go to Agents → Deploy New Agent. It's ready in about a minute.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">
          <h3>Connect a platform</h3>
          <p>Link Telegram, Discord, or Slack to start chatting.</p>
        </div>
      </div>
    </div>

    ${
      apiKey
        ? `
    <div class="card">
      <h2>Your API Key</h2>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px;">Use this to connect external tools to your agent:</p>
      <div class="api-key">${apiKey}</div>
      <p style="color: #71717a; font-size: 12px; margin: 0;">Keep this safe — it won't be shown again. You can regenerate it from your dashboard.</p>
    </div>
    `
        : ''
    }

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://laverdi.tech/dashboard" class="btn">Go to Dashboard →</a>
    </div>

    <div class="footer">
      <p>LaVerdi — Your AI Agent Platform</p>
      <p>Questions? Reply to this email or reach us at support@laverdi.tech</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@laverdi.tech',
      to,
      subject,
      html,
    })
    console.log(`✉ Welcome email sent to ${to}`)
  } catch (err) {
    console.error(`Failed to send welcome email to ${to}:`, err)
    // Don't throw — email failure shouldn't break the signup flow
  }
}
